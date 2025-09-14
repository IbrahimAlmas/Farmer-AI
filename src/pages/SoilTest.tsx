import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera as CameraIcon, Image as ImageIcon, RefreshCw, Play, Upload, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const getUploadUrl = useMutation(api.soil_upload.getUploadUrl);
  const analyzeImage = useAction(api.soil.analyzeImage);

  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<"intro" | "capture" | "review" | "results">("intro");

  useEffect(() => {
    let didCancel = false;
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
    setStep("capture"); // ensure step resets if camera is stopped
    setErrorMsg(null);
  };

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      // Stop any existing stream first (prevents stuck camera on retry)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Live camera isn't supported by this browser. Use 'Upload Photo' instead.");
        setCameraOn(false);
        setCameraReady(false);
        return;
      }
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to ensure correct videoWidth/Height before drawImage
        await new Promise<void>((resolve) => {
          const v = videoRef.current!;
          const onLoaded = () => {
            v.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          v.addEventListener("loadedmetadata", onLoaded);
        });
        await videoRef.current.play().catch(() => {});
      }

      setCameraOn(true);
      setCameraReady(true);
      setCameraError(null);
    } catch (e: any) {
      const msg =
        e?.name === "NotAllowedError"
          ? "Camera permission denied. Enable camera access in browser settings or use 'Upload Photo'."
          : e?.name === "NotFoundError"
          ? "No camera found. Use 'Upload Photo' instead."
          : e?.message ?? "Unable to access camera.";
      setCameraError(msg);
      setCameraOn(false);
      setCameraReady(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setErrorMsg(null);
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
          setStep("review"); // move to review after capture
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
    setErrorMsg(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setStep("review"); // move to review after selecting
  };

  const runCameraAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
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
      setStep("results");
    } catch (e: any) {
      setResult(null);
      const raw = e?.message ?? "";
      let msg = "Unable to analyze this image. Please upload a clear photo of soil.";
      if (typeof raw === "string") {
        const lc = raw.toLowerCase();
        if (lc.includes("please add a photo of soil") || lc.includes("not a soil")) {
          msg = "This is not a soil photo. Please upload a clear photo of soil.";
        } else if (lc.includes("photo of soil")) {
          msg = "Please upload a clear photo of soil.";
        }
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Soil Test">
      <div className="relative">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-sky-400/20 to-indigo-400/10 blur-3xl" />
        </div>

        <div className="p-4 mx-auto max-w-6xl">
          {/* NEW: Intro step with information and single CTA */}
          {step === "intro" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className=""
            >
              {/* Reworked layout: main card left, right rail stacks "Why test soil?" over "Sample insights" */}
              <div className="grid gap-6 items-start lg:grid-cols-[1fr_320px]">
                {/* LEFT: Main Soil Health Check (moved to the far left) */}
                <div>
                  <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Soil Health Check</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-xl border overflow-hidden bg-muted">
                        <img
                          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000&auto=format&fit=crop"
                          alt="Wide farmland with clearly visible soil rows"
                          className="w-full h-52 sm:h-60 object-cover"
                          onError={(e) => {
                            const t = e.currentTarget as HTMLImageElement;
                            if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                            t.onerror = null;
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          Quickly estimate pH, moisture, and key nutrients from a soil photo. Use daylight and frame a small patch of bare soil.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Use natural light and focus on bare soil surface</li>
                          <li>Avoid leaves, tools, or people in the frame</li>
                          <li>Fill most of the frame with soil; keep angle roughly top‑down</li>
                        </ul>
                      </div>
                      <div className="flex justify-start">
                        <Button
                          className="gap-2 px-6 py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto min-w-[200px] bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                          onClick={() => {
                            setErrorMsg(null);
                            setResult(null);
                            setStep("capture");
                            // do not auto-start camera
                          }}
                        >
                          Start Soil Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT: Sticky rail with Why test soil (top) and Sample insights (bottom) */}
                <div className="hidden lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-24 self-start">
                  {/* Why test soil? */}
                  <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Why test soil?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-2">
                      <p>Soil health drives yield, quality, and sustainability.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Detect pH problems early</li>
                        <li>Optimize nutrient application</li>
                        <li>Improve water retention</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Sample insights (stacked below) */}
                  <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sample insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <div className="text-[11px] text-muted-foreground mb-1">Typical pH (ideal 6.0–7.5)</div>
                        <Progress value={70} />
                      </div>
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <div className="text-[11px] text-muted-foreground mb-1">Moisture target (20–40%)</div>
                        <Progress value={28} />
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Results are estimates from photo analysis; confirm with lab tests if needed.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* Centered capture step with side panels */}
          {step === "capture" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className=""
            >
              <div className="grid gap-6 items-start lg:grid-cols-[280px_1fr_280px]">
                {/* Left side tips */}
                <div className="hidden lg:block lg:sticky lg:top-24 self-start">
                  <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Pro tips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-2">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Frame only the soil surface</li>
                        <li>Avoid shadows; use daylight</li>
                        <li>Hold steady for sharp focus</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Main capture card */}
                <div>
                  <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg sm:text-xl font-semibold">Soil Test</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cameraOn ? (
                        <div className="relative rounded-xl border overflow-hidden bg-muted">
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                          <div className="aspect-[4/3] w-full">
                            <video
                              ref={videoRef}
                              className="h-full w-full object-cover"
                              playsInline
                              muted
                              autoPlay
                            />
                          </div>

                          {/* Camera overlay guides */}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-[55%] w-[70%] max-w-[520px] rounded-2xl border border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.08)]" />
                          </div>
                          <div className="pointer-events-none absolute top-3 left-3 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/40 text-white">
                            Aim at bare soil, avoid leaves/tools
                          </div>

                          {/* Overlay controls when camera is ON */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                            <div className="flex flex-wrap gap-2">
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
                                    Click Photo
                                  </>
                                )}
                              </Button>
                              <Button variant="outline" onClick={stopCamera} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Stop
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Enhanced placeholder BEFORE enabling camera
                        <div className="relative rounded-xl border overflow-hidden bg-muted">
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/5 via-transparent to-transparent" />
                          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                            <img
                              src="https://images.unsplash.com/photo-1525824236856-8b420b9bb75b?q=80&w=1600&auto=format&fit=crop"
                              alt="Soil guide"
                              className="w-full max-w-2xl h-44 object-cover rounded-lg border"
                              onError={(e) => {
                                const t = e.currentTarget as HTMLImageElement;
                                if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                                t.onerror = null;
                              }}
                            />
                            <div className="grid gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="outline">Tip</Badge>
                                Use natural light • Focus on bare soil • Keep phone steady
                              </div>
                              <div>Or upload a clear close-up if your camera isn't available.</div>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              <Button
                                variant="default"
                                onClick={startCamera}
                                className="gap-2 px-6 py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto min-w-[200px] bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                              >
                                <Play className="h-5 w-5" />
                                Enable Camera
                              </Button>
                              <label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={onSelectFile}
                                  className="hidden"
                                />
                                <Button
                                  variant="default"
                                  className="gap-2 px-6 py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto min-w-[200px] bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                                  asChild
                                >
                                  <span>
                                    <Upload className="h-5 w-5" />
                                    Upload Photo
                                  </span>
                                </Button>
                              </label>
                            </div>

                            {/* Troubleshooter */}
                            <details className="w-full max-w-xl mx-auto text-left mt-1">
                              <summary className="text-xs text-muted-foreground cursor-pointer">
                                Having trouble enabling camera?
                              </summary>
                              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                <p>1) Allow camera permission in your browser settings.</p>
                                <p>2) Switch to a browser like Chrome, Safari, or Edge.</p>
                                <p>3) If still blocked, use Upload Photo.</p>
                              </div>
                            </details>
                          </div>
                        </div>
                      )}

                      {cameraError && !cameraReady && (
                        <div className="text-xs text-red-600 text-center">
                          {cameraError} — You can still upload a photo.
                        </div>
                      )}

                      {/* Hidden canvas for capture */}
                      <canvas ref={canvasRef} className="hidden" />
                    </CardContent>
                  </Card>
                </div>

                {/* Right side sample preview */}
                <div className="hidden lg:block lg:sticky lg:top-24 self-start">
                  <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sample result preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <div className="text-[11px] text-muted-foreground mb-1">pH</div>
                        <Progress value={68} />
                      </div>
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <div className="text-[11px] text-muted-foreground mb-1">Moisture</div>
                        <Progress value={35} />
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-[11px] text-muted-foreground mb-1">Organic Matter</div>
                        <Progress value={50} />
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Upload a photo of soil to get your actual analysis.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* Review step */}
          {step === "review" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ImageIcon className="h-4 w-4" />
                    Review Photo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative group rounded-xl border overflow-hidden bg-background">
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          alt="Soil preview"
                          className="w-full object-cover max-h-[420px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-center">
                          <Button onClick={runCameraAnalysis} disabled={loading || !file} className="gap-2">
                            {loading ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Analyzing…
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4" />
                                Analyze Photo
                              </>
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setFile(null);
                              setPreview(null);
                              setResult(null);
                              setStep("capture");
                              startCamera().catch(() => {});
                            }}
                          >
                            Retake
                          </Button>
                          <label>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={onSelectFile}
                              className="hidden"
                            />
                            <Button variant="outline" className="gap-2" asChild>
                              <span>
                                <Upload className="h-4 w-4" />
                                Add More
                              </span>
                            </Button>
                          </label>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-48">
                        <div className="text-sm text-muted-foreground">No image selected</div>
                      </div>
                    )}
                  </div>
                  {errorMsg && (
                    <Alert variant="destructive" className="rounded-lg">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results step */}
          {step === "results" && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Photo + actions */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ImageIcon className="h-4 w-4" />
                      Photo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative rounded-xl border overflow-hidden bg-background">
                      {preview && (
                        <img
                          src={preview}
                          alt="Soil preview"
                          className="w-full object-cover max-h-[360px]"
                        />
                      )}
                      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-center">
                        <Button onClick={runCameraAnalysis} disabled={loading || !file} className="gap-2">
                          {loading ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Re-Analyzing…
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4" />
                              Analyze Again
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                            setResult(null);
                            setStep("capture");
                            startCamera().catch(() => {});
                          }}
                        >
                          Retake
                        </Button>
                        <label>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={onSelectFile}
                            className="hidden"
                          />
                          <Button variant="outline" className="gap-2" asChild>
                            <span>
                              <Upload className="h-4 w-4" />
                              Add More
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {errorMsg && (
                      <Alert variant="destructive" className="rounded-lg">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{errorMsg}</AlertDescription>
                      </Alert>
                    )}

                    {!result && (
                      <div className="text-sm text-muted-foreground">
                        No results available. Analyze the photo to see results here.
                      </div>
                    )}

                    {result && (
                      <div className="space-y-6">
                        {/* Primary metrics */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border p-4 bg-muted/30">
                            <div className="text-xs text-muted-foreground mb-1">pH</div>
                            <div className="flex items-baseline justify-between">
                              <div className="text-2xl font-semibold">{result.ph}</div>
                              <Badge variant="outline">Ideal: 6.0–7.5</Badge>
                            </div>
                            <div className="mt-3">
                              <Progress value={((result.ph - 4) / (9 - 4)) * 100} />
                            </div>
                          </div>

                          <div className="rounded-lg border p-4 bg-muted/30">
                            <div className="text-xs text-muted-foreground mb-1">Moisture</div>
                            <div className="flex items-baseline justify-between">
                              <div className="text-2xl font-semibold">{result.moisture}%</div>
                              <Badge variant="outline">Target: 20–40%</Badge>
                            </div>
                            <div className="mt-3">
                              <Progress value={Math.min(100, Math.max(0, result.moisture))} />
                            </div>
                          </div>
                        </div>

                        {/* Nutrients */}
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground mb-1">Nitrogen</div>
                            <div className="text-xl font-semibold">{result.nitrogen} mg/kg</div>
                          </div>
                          <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground mb-1">Phosphorus</div>
                            <div className="text-xl font-semibold">{result.phosphorus} mg/kg</div>
                          </div>
                          <div className="rounded-lg border p-4">
                            <div className="text-xs text-muted-foreground mb-1">Potassium</div>
                            <div className="text-xl font-semibold">{result.potassium} mg/kg</div>
                          </div>
                        </div>

                        {/* Organic matter */}
                        <div className="rounded-lg border p-4 bg-muted/30">
                          <div className="text-xs text-muted-foreground mb-2">Organic Matter</div>
                          <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-semibold">{result.organicMatter}%</div>
                            <Badge variant="outline">Healthy: 3–6%</Badge>
                          </div>
                          <div className="mt-3">
                            <Progress value={Math.min(100, (result.organicMatter / 6) * 100)} />
                          </div>
                        </div>

                        {/* Recommendations */}
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
          )}
        </div>
      </div>
    </AppShell>
  );
}