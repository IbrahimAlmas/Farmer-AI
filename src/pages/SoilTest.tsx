import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";

type Analysis = {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  organicMatter: number;
  recommendations: string[];
};

export default function SoilTest() {
  const analyzeMock = useAction(api.soil.analyzeMock);
  const getUploadUrl = useMutation(api.soil_upload.getUploadUrl);
  const analyzeImage = useAction(api.soil.analyzeImage);

  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera automatically on mount
  useEffect(() => {
    let didCancel = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera not supported on this device/browser.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (didCancel) {
          // If component unmounted early, stop tracks
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraOn(true);
        setCameraReady(true);
        setCameraError(null);
      } catch (e: any) {
        setCameraError(e?.message ?? "Unable to access camera.");
        setCameraOn(false);
        setCameraReady(false);
      }
    })();
    return () => {
      didCancel = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setCameraReady(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      setCameraReady(true);
      setCameraError(null);
    } catch (e: any) {
      setCameraError(e?.message ?? "Unable to access camera.");
      setCameraOn(false);
      setCameraReady(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to blob, then File for upload
    await new Promise<void>((resolve) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) return resolve();
          const photoFile = new File([blob], "soil.jpg", { type: "image/jpeg" });
          setFile(photoFile);
          const previewUrl = URL.createObjectURL(photoFile);
          setPreview(previewUrl);
          resolve();
        },
        "image/jpeg",
        0.92,
      );
    });
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const runCameraAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const uploadUrl = await getUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const json = (await res.json()) as { storageId: string };
      const analysis = await analyzeImage({ imageId: json.storageId as any });
      setResult(analysis as any);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const run = async () => {
    setLoading(true);
    try {
      const res = await analyzeMock({});
      setResult(res as any);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Soil Test">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Camera Analysis (AI)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {/* Live Camera */}
            <div className="space-y-2">
              <div className="aspect-video w-full rounded-md border overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              </div>
              {!cameraReady && cameraError && (
                <div className="text-xs text-red-600">
                  {cameraError} — You can still upload a photo below.
                </div>
              )}
              <div className="flex gap-2">
                {!cameraOn ? (
                  <Button variant="secondary" onClick={startCamera}>
                    Enable Camera
                  </Button>
                ) : (
                  <>
                    <Button onClick={capturePhoto} disabled={!cameraReady || loading}>
                      {loading ? "Processing..." : "Capture Photo"}
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                      Stop Camera
                    </Button>
                  </>
                )}
              </div>
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Preview & Upload Flow */}
            {preview && (
              <img
                src={preview}
                alt="Soil preview"
                className="w-full rounded-md border"
              />
            )}

            {/* Fallback file input */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Or upload a photo:</div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onSelectFile}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={runCameraAnalysis} disabled={loading || !file}>
                {loading ? "Analyzing..." : "Analyze Photo"}
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Mock Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={run} disabled={loading}>{loading ? "Analyzing..." : "Run Analysis"}</Button>
            {result && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">pH:</span> {result.ph}</div>
                <div><span className="text-muted-foreground">Moisture:</span> {result.moisture}%</div>
                <div><span className="text-muted-foreground">Nitrogen:</span> {result.nitrogen} mg/kg</div>
                <div><span className="text-muted-foreground">Phosphorus:</span> {result.phosphorus} mg/kg</div>
                <div><span className="text-muted-foreground">Potassium:</span> {result.potassium} mg/kg</div>
                <div><span className="text-muted-foreground">Organic Matter:</span> {result.organicMatter}%</div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Recommendations:</div>
                  <ul className="list-disc pl-5">
                    {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}