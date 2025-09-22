import type React from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SoilIntro } from "@/components/soil/Intro";
import { SoilCapture } from "@/components/soil/Capture";
import { SoilReview } from "@/components/soil/Review";
import { SoilResults } from "@/components/soil/Results";
import type { Analysis } from "@/types/soil";
import { SoilTestAssistant, type SoilAssistantSuggestion } from "@/components/SoilTestAssistant";

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

  // Inline chat removed (using SoilTestAssistant)

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

  // (removed legacy parseIntent; handled by assistant UI)

  // (removed inline chat submit handler)

  const suggestionActions: Array<{ id: string; label: string }> = [
    { id: "enable_camera", label: "Enable Camera" },
    { id: "upload_photo", label: "Upload Photo" },
    { id: "click_photo", label: "Click Photo" },
    { id: "analyze_photo", label: "Analyze Photo" },
    { id: "retake", label: "Retake" },
    { id: "stop_camera", label: "Stop Camera" },
  ];

  // Listen for global assistant actions
  useEffect(() => {
    const handler = async (e: Event) => {
      const ce = e as CustomEvent<{ actionId?: string }>;
      const actionId = ce.detail?.actionId;
      if (!actionId) return;
      try {
        // Reuse the same local action executor
        await doAction(actionId);
      } catch {
        // no-op: errors are already handled in doAction
      }
    };
    window.addEventListener("assistant:action", handler as EventListener);
    return () => {
      window.removeEventListener("assistant:action", handler as EventListener);
    };
  }, [doAction]);

  useEffect(() => {
    return () => {
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
        <div className="hidden pointer-events-none absolute inset-0 -z-10 overflow-hidden">
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

            {/* NEW: Intro step redesigned to match reference (hero + two cards + why section) */}
            {step === "intro" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <SoilIntro
                  onStart={() => {
                    setErrorMsg(null);
                    setResult(null);
                    setStep("capture");
                  }}
                />
              </motion.div>
            )}

            {/* Centered capture step with side panels */}
            {step === "capture" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <SoilCapture
                  cameraOn={cameraOn}
                  cameraReady={cameraReady}
                  cameraError={cameraError}
                  loading={loading}
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  startCamera={startCamera}
                  stopCamera={stopCamera}
                  capturePhoto={capturePhoto}
                  fileInputRef={fileInputRef}
                />
              </motion.div>
            )}

            {/* Review step */}
            {step === "review" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <SoilReview
                  preview={preview}
                  loading={loading}
                  file={file}
                  runCameraAnalysis={runCameraAnalysis}
                  onRetake={() => {
                    setFile(null);
                    setPreview(null);
                    setResult(null);
                    setStep("capture");
                    startCamera().catch(() => {});
                  }}
                  fileInputRef={fileInputRef}
                  errorMsg={errorMsg}
                />
              </motion.div>
            )}

            {/* Results step */}
            {step === "results" && (
              <SoilResults
                preview={preview}
                loading={loading}
                file={file}
                result={result}
                errorMsg={errorMsg}
                runCameraAnalysis={runCameraAnalysis}
                onRetake={() => {
                  setFile(null);
                  setPreview(null);
                  setResult(null);
                  setStep("capture");
                  startCamera().catch(() => {});
                }}
                fileInputRef={fileInputRef}
              />
            )}
          </div>
        </div>

        {/* Floating Assistant (extracted component) */}
        <SoilTestAssistant
          suggestions={suggestionActions as SoilAssistantSuggestion[]}
          onAction={doAction}
        />
      </div>
    </AppShell>
  );
}