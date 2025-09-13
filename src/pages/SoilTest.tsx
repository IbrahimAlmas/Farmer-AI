import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera as CameraIcon, Image as ImageIcon, RefreshCw, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
      <div className="p-4 space-y-6">
        {/* Top summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 md:grid-cols-3"
        >
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Camera</div>
              <div className="flex items-center justify-between">
                <div className="font-medium">{cameraOn ? "Enabled" : "Disabled"}</div>
                <Badge variant={cameraReady ? "default" : cameraOn ? "secondary" : "outline"}>
                  {cameraReady ? "Ready" : cameraOn ? "Loading…" : "Off"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Analysis Mode</div>
              <div className="flex items-center justify-between">
                <div className="font-medium">AI Photo Analysis</div>
                <Badge variant="outline">Beta</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className="flex items-center justify-between">
                <div className="font-medium">{loading ? "Processing…" : result ? "Results Ready" : "Idle"}</div>
                <Badge variant={loading ? "secondary" : result ? "default" : "outline"}>
                  {loading ? "Working" : result ? "Done" : "Waiting"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main workspace */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Live Camera */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CameraIcon className="h-4 w-4" />
                  Live Camera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-video w-full rounded-lg border overflow-hidden bg-muted">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                </div>

                {cameraError && !cameraReady && (
                  <div className="text-xs text-red-600">
                    {cameraError} — You can still upload a photo on the right.
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!cameraOn ? (
                    <Button variant="secondary" onClick={startCamera} className="gap-2">
                      <Play className="h-4 w-4" />
                      Enable Camera
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={capturePhoto}
                        disabled={!cameraReady || loading}
                        className="gap-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <CameraIcon className="h-4 w-4" />
                            Capture
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={stopCamera} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Capture, Upload & Analyze */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4" />
                  Capture / Upload & Analyze
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {preview ? (
                  <div className="rounded-lg border overflow-hidden bg-background">
                    <img
                      src={preview}
                      alt="Soil preview"
                      className="w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
                    No image yet. Capture from camera or upload a photo.
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Or upload a photo</div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onSelectFile}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={runCameraAnalysis} disabled={loading || !file} className="gap-2">
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <CameraIcon className="h-4 w-4" />
                        Analyze Photo
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setResult(null);
                    }}
                  >
                    Clear
                  </Button>
                  <Button variant="secondary" onClick={run} disabled={loading}>
                    {loading ? "Analyzing…" : "Run Mock Analysis"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!result && (
                <div className="text-sm text-muted-foreground">
                  Capture or upload a soil photo and run analysis to see results here.
                </div>
              )}

              {result && (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">pH</div>
                      <div className="flex items-baseline justify-between">
                        <div className="text-xl font-semibold">{result.ph}</div>
                        <Badge variant="outline">Ideal: 6.0–7.5</Badge>
                      </div>
                      <div className="mt-2">
                        <Progress value={((result.ph - 4) / (9 - 4)) * 100} />
                      </div>
                    </div>

                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Moisture</div>
                      <div className="flex items-baseline justify-between">
                        <div className="text-xl font-semibold">{result.moisture}%</div>
                        <Badge variant="outline">Target: 20–40%</Badge>
                      </div>
                      <div className="mt-2">
                        <Progress value={Math.min(100, Math.max(0, result.moisture))} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Nitrogen</div>
                      <div className="text-xl font-semibold">{result.nitrogen} mg/kg</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Phosphorus</div>
                      <div className="text-xl font-semibold">{result.phosphorus} mg/kg</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Potassium</div>
                      <div className="text-xl font-semibold">{result.potassium} mg/kg</div>
                    </div>
                  </div>

                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground mb-2">Organic Matter</div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-xl font-semibold">{result.organicMatter}%</div>
                      <Badge variant="outline">Healthy: 3–6%</Badge>
                    </div>
                    <div className="mt-2">
                      <Progress value={Math.min(100, (result.organicMatter / 6) * 100)} />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Recommendations</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {result.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  );
}