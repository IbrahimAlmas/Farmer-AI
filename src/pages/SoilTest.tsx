import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera as CameraIcon, Image as ImageIcon, RefreshCw, Play, Upload, Wand2, MessageSquare, Send } from "lucide-react";
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
  const startedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Chatbot state
  type ChatMessage = { role: "user" | "assistant"; text: string };
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Hi! I can control this page for you. Try: "Enable Camera", "Upload Photo", "Click Photo", "Analyze Photo", "Retake", or "Stop Camera".`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Helper to push a message
  const pushMessage = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  // Execute a known action id
  const doAction = async (actionId: string): Promise<string> => {
    try {
      switch (actionId) {
        case "enable_camera":
          await startCamera();
          return "Camera enabled.";
        case "upload_photo":
          fileInputRef.current?.click();
          return "Opening file picker…";
        case "click_photo":
          await capturePhoto();
          return "Photo captured. You can now review it.";
        case "analyze_photo":
          if (!file) return "No photo selected yet. Please capture or upload a photo first.";
          await runCameraAnalysis();
          return "Analyzing your photo now…";
        case "retake":
          setFile(null);
          setPreview(null);
          setResult(null);
          setStep("capture");
          await startCamera().catch(() => {});
          return "Ready to retake. Camera re-enabled.";
        case "stop_camera":
          stopCamera();
          return "Camera stopped.";
        case "go_intro":
          stopCamera();
          setStep("intro");
          return "Back to the intro.";
        case "help":
          return "Available actions: Enable Camera, Upload Photo, Click Photo, Analyze Photo, Retake, Stop Camera, Go to Intro.";
        case "status":
          return `Status — Step: ${step}. Camera: ${cameraOn ? "on" : "off"}. ${file ? "Photo selected." : "No photo selected."} ${result ? "Analysis available." : "No analysis yet."}`;
        default:
          // Fix: use backticks to safely include "help"
          return `I didn't recognize that action. Say "help" to see available actions.`;
      }
    } catch (e: any) {
      return e?.message ?? "Something went wrong performing that action.";
    }
  };

  // Very simple intent parser for NL commands
  const parseIntent = (text: string): string => {
    const t = text.toLowerCase().trim();
    if (/^(help|\?)$/.test(t) || t.includes("help")) return "help";
    if (t.includes("status")) return "status";
    if (t.includes("go to intro") || t.includes("back to intro")) return "go_intro";
    if (t.includes("enable") && t.includes("camera")) return "enable_camera";
    if (t.includes("start") && t.includes("camera")) return "enable_camera";
    if ((t.includes("upload") && t.includes("photo")) || t.includes("choose file")) return "upload_photo";
    if (t.includes("click") && t.includes("photo")) return "click_photo";
    if (t.includes("take") && (t.includes("photo") || t.includes("picture") || t.includes("shot"))) return "click_photo";
    if (t.includes("analyze")) return "analyze_photo";
    if (t.includes("retake")) return "retake";
    if (t.includes("stop") && t.includes("camera")) return "stop_camera";
    return "";
  };

  const handleChatSubmit = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    pushMessage({ role: "user", text });

    const actionId = parseIntent(text);
    if (actionId) {
      const reply = await doAction(actionId);
      pushMessage({ role: "assistant", text: reply });
      return;
    }

    // Fallback generic response
    pushMessage({
      role: "assistant",
      // Fix: use backticks so inner quotes don't break parsing
      text: `I can help with camera and analysis actions. Try: "Enable Camera", "Upload Photo", "Click Photo", "Analyze Photo", "Retake", or "Stop Camera".`,
    });
  };

  const suggestionActions: Array<{ id: string; label: string }> = [
    { id: "enable_camera", label: "Enable Camera" },
    { id: "upload_photo", label: "Upload Photo" },
    { id: "click_photo", label: "Click Photo" },
    { id: "analyze_photo", label: "Analyze Photo" },
    { id: "retake", label: "Retake" },
    { id: "stop_camera", label: "Stop Camera" },
  ];

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

  useEffect(() => {
    if (step === "capture" && !cameraOn && !startedRef.current) {
      startedRef.current = true;
      startCamera().catch(() => {
        // fall back handled in startCamera; keep silent here
      });
    }
  }, [step, cameraOn]);

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
    startedRef.current = false; // reset auto-start guard
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

      // Try back camera first; if it fails, retry with generic video
      const primaryConstraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const fallbackConstraints: MediaStreamConstraints = {
        video: true,
        audio: false,
      };

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      } catch {
        // Retry with fallback (desktop webcams or devices without env camera)
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const v = videoRef.current;
        v.srcObject = stream;
        // Wait metadata for correct dimensions
        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            v.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          v.addEventListener("loadedmetadata", onLoaded);
        });

        try {
          await v.play();
        } catch (playErr: any) {
          // Autoplay sometimes requires a user gesture
          setCameraError(
            "Tap 'Enable Camera' again to start preview (autoplay blocked). Or use 'Upload Photo'."
          );
          // We still consider camera on; user can press capture or retry
        }
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

        {/* Tighter, centered container */}
        <div className="p-4 mx-auto max-w-5xl">
          <div className="p-5 mx-auto max-w-6xl">
            {/* Add: hidden global file input to trigger programmatically */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="hidden"
            />

            {/* NEW: Intro step with information and single CTA */}
            {step === "intro" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className=""
              >
                {/* Reworked layout with tighter gaps and fixed right rail width */}
                <div className="grid items-start gap-4 lg:gap-6 lg:grid-cols-[1fr_300px]">
                  {/* LEFT: Main Soil Health Check */}
                  <div>
                    <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Soil Health Check</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-xl border overflow-hidden bg-muted">
                          <img
                            src="/assets/Soil.webp"
                            alt="Wide farmland with clearly visible soil rows"
                            className="w-full h-72 sm:h-80 object-cover"
                            onError={(e) => {
                              const t = e.currentTarget as HTMLImageElement;
                              if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                              t.onerror = null;
                            }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1.5">
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
                  <div className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-24 self-start w-[360px]">
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

                    {/* Sample insights */}
                    <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sample insights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-lg border p-3 bg-muted/30">
                          <div className="text-[11px] text-muted-foreground mb-1">Typical pH (ideal 6.0–7.5)</div>
                          <Progress value={70} className="h-3" />
                        </div>
                        <div className="rounded-lg border p-3 bg-muted/30">
                          <div className="text-[11px] text-muted-foreground mb-1">Moisture target (20–40%)</div>
                          <Progress value={28} className="h-3" />
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
                {/* UPDATED LAYOUT: Left = Soil Test capture, Right = Pro tips (top) + Sample preview (bottom) */}
                <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_380px]">
                  {/* LEFT: Main capture card */}
                  <div className="">
                    <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl sm:text-2xl font-semibold">Soil Test</CardTitle>
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
                                <Button
                                  variant="default"
                                  className="gap-2 px-6 py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto min-w-[200px] bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="h-5 w-5" />
                                  Upload Photo
                                </Button>
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

                  {/* RIGHT: Pro tips (top) + Sample result preview (bottom) */}
                  <div className="flex flex-col gap-4">
                    {/* Pro tips */}
                    <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Pro tips</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground space-y-2">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Frame only the soil surface</li>
                          <li>Avoid shadows; use daylight</li>
                          <li>Hold steady for sharp focus</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Sample result preview */}
                    <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Sample result preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-lg border p-3 bg-muted/30">
                          <div className="text-[11px] text-muted-foreground mb-1">pH</div>
                          <Progress value={68} className="h-3" />
                        </div>
                        <div className="rounded-lg border p-3 bg-muted/30">
                          <div className="text-[11px] text-muted-foreground mb-1">Moisture</div>
                          <Progress value={35} className="h-3" />
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-[11px] text-muted-foreground mb-1">Organic Matter</div>
                          <Progress value={50} className="h-3" />
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
                className="max-w-2xl mx-auto"
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
                            className="w-full object-cover max-h-[520px]"
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
                            <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="h-4 w-4" />
                              Add More
                            </Button>
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
                            className="w-full object-cover max-h-[480px]"
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
                          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-4 w-4" />
                            Add More
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Results */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="overflow-hidden border-emerald-200 bg-emerald-50/70 dark:bg-emerald-900/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-emerald-900 dark:text-emerald-200">Analysis Results</CardTitle>
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
                            <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50/60 dark:bg-emerald-900/20">
                              <div className="text-xs text-muted-foreground mb-1">pH</div>
                              <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-semibold">{result.ph}</div>
                                <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:text-emerald-300">Ideal: 6.0–7.5</Badge>
                              </div>
                              <div className="mt-3">
                                <Progress value={((result.ph - 4) / (9 - 4)) * 100} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" />
                              </div>
                            </div>

                            <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50/60 dark:bg-emerald-900/20">
                              <div className="text-xs text-muted-foreground mb-1">Moisture</div>
                              <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-semibold">{result.moisture}%</div>
                                <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:text-emerald-300">Target: 20–40%</Badge>
                              </div>
                              <div className="mt-3">
                                <Progress value={Math.min(100, Math.max(0, result.moisture))} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" />
                              </div>
                            </div>
                          </div>

                          {/* Nutrients */}
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border border-emerald-200 p-4">
                              <div className="text-xs text-muted-foreground mb-1">Nitrogen</div>
                              <div className="text-xl font-semibold">{result.nitrogen} mg/kg</div>
                            </div>
                            <div className="rounded-lg border border-emerald-200 p-4">
                              <div className="text-xs text-muted-foreground mb-1">Phosphorus</div>
                              <div className="text-xl font-semibold">{result.phosphorus} mg/kg</div>
                            </div>
                            <div className="rounded-lg border border-emerald-200 p-4">
                              <div className="text-xs text-muted-foreground mb-1">Potassium</div>
                              <div className="text-xl font-semibold">{result.potassium} mg/kg</div>
                            </div>
                          </div>

                          {/* Organic matter */}
                          <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50/60 dark:bg-emerald-900/20">
                            <div className="text-xs text-muted-foreground mb-2">Organic Matter</div>
                            <div className="flex items-baseline justify-between">
                              <div className="text-2xl font-semibold">{result.organicMatter}%</div>
                              <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:text-emerald-300">Healthy: 3–6%</Badge>
                            </div>
                            <div className="mt-3">
                              <Progress value={Math.min(100, (result.organicMatter / 6) * 100)} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" />
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

        {/* Floating Chatbot */}
        <div className="fixed bottom-4 right-4 z-50">
          {!chatOpen && (
            <Button
              className="rounded-full size-12 p-0 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => setChatOpen(true)}
              aria-label="Open Assistant"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}

          {chatOpen && (
            <div className="w-[320px] sm:w-[360px] rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[oklch(0.98_0.01_120)]">
                <div className="text-sm font-semibold">Soil Test Assistant</div>
                <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="px-3 pt-2 pb-1 border-b">
                <div className="flex flex-wrap gap-2">
                  {suggestionActions.map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={async () => {
                        const reply = await doAction(s.id);
                        pushMessage({ role: "assistant", text: reply });
                      }}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="h-56 overflow-y-auto px-3 py-2 space-y-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "assistant"
                        ? "bg-[oklch(0.98_0.01_120)] text-foreground"
                        : "bg-emerald-600 text-white ml-auto"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-2 border-t bg-white">
                <input
                  className="flex-1 h-9 px-3 rounded-md border ring-0 outline-none text-sm"
                  placeholder="Type a command…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleChatSubmit();
                  }}
                />
                <Button onClick={handleChatSubmit} className="h-9">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}