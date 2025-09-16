import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  onTranscript?: (text: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  disabled?: boolean;
  className?: string;
  transcribe: (args: { audio: ArrayBuffer; language?: string; contentType?: string; filename?: string }) => Promise<string>;
  language?: string;
  // Add: embedded dock mode (renders inline without floating/drag)
  embedInDock?: boolean;
};

export default function VoiceButton({
  onTranscript,
  onRecordingChange,
  disabled,
  className,
  transcribe,
  language,
  // Add: embedded dock mode
  embedInDock,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeRef = useRef<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  // Add: quick burst ripple on click
  const [burst, setBurst] = useState<number>(0);
  // Add: guard to prevent concurrent start() calls which can cause permission prompts to fail
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setSupported(typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Skip position logic entirely when embedded in dock
  useEffect(() => {
    if (embedInDock) return;
    const saved = localStorage.getItem("voiceButtonPos");
    if (saved) {
      try {
        const p = JSON.parse(saved) as { x: number; y: number };
        setPos(p);
        return;
      } catch {
        // ignore
      }
    }
    const pad = 16;
    const size = 56; // approx button size
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = Math.max(pad, Math.min(vw - size - pad, vw / 2 - size / 2));
    const y = Math.max(pad, Math.min(vh - size - pad, vh - 120));
    setPos({ x, y });
  }, [embedInDock]);

  function getSupportedMime(): string | null {
    const candidates: Array<string> = [
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/mpeg",
      "audio/webm",
      "audio/ogg",
    ];
    for (const c of candidates) {
      if ((window as any).MediaRecorder && (MediaRecorder as any).isTypeSupported?.(c)) {
        return c;
      }
    }
    return null;
  }

  async function start() {
    // Prevent recording if this interaction is a drag
    if (isDraggingRef.current) return;
    if (!supported || disabled) {
      toast.error("Voice recording is not supported on this device/browser.");
      return;
    }
    if (isStarting || recording) return; // prevent double starts
    setIsStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chosen = getSupportedMime();
      mimeRef.current = chosen;
      const mr = chosen ? new MediaRecorder(stream, { mimeType: chosen }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blobType = mimeRef.current ?? "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        const buf = await blob.arrayBuffer();
        // derive filename extension
        const ext =
          blobType.includes("mp4") ? "mp4" :
          blobType.includes("mpeg") ? "mp3" :
          blobType.includes("ogg") ? "ogg" :
          "webm";
        try {
          const text = await transcribe({ audio: buf, language, contentType: blobType, filename: `audio.${ext}` });
          onTranscript?.(text);
        } catch (e: any) {
          toast.error(e?.message ?? "Transcription failed");
          console.error("Transcription failed", e);
        }
        (stream.getTracks() || []).forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      onRecordingChange?.(true);
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError") {
        toast.error("Microphone access was blocked. Please allow mic permission and try again.");
      } else if (name === "NotFoundError") {
        toast.error("No microphone found. Please connect a mic and try again.");
      } else if (name === "NotReadableError") {
        toast.error("Microphone is in use by another app. Close it and try again.");
      } else if (name === "SecurityError") {
        toast.error("Microphone requires a secure context (HTTPS).");
      } else {
        toast.error(err?.message ?? "Failed to access microphone");
      }
      console.error("Failed to start recording", err);
    } finally {
      setIsStarting(false);
    }
  }

  function stop() {
    if (isDraggingRef.current) return;
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      // ignore
    }
    setRecording(false);
    onRecordingChange?.(false);
  }

  const toggle = () => {
    if (isDraggingRef.current || isStarting) return;
    // Add: trigger click burst ripple
    setBurst(Date.now());
    if (!recording) start();
    else stop();
  };

  // New: Embedded in Dock rendering (no drag/positioning)
  if (embedInDock) {
    return (
      <div className={`relative ${className ?? ""}`} aria-label="Voice controls in dock">
        {/* Click burst ripple */}
        {burst !== 0 && (
          <motion.span
            key={burst}
            className="pointer-events-none absolute inset-0 rounded-3xl bg-primary/25"
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 1.75, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            aria-hidden
          />
        )}

        {/* Enhanced recording aura */}
        {recording && (
          <>
            {/* Soft inner pulse */}
            <motion.span
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-16 rounded-full bg-red-500/15 blur-sm"
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.35, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            {/* Concentric rings */}
            <motion.span
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full ring-2 ring-red-500/45"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.25, 0.6] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.span
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-28 rounded-full ring-2 ring-red-500/30"
              animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.15, 0.45] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
              aria-hidden
            />
            {/* Rotating dashed ring */}
            <motion.span
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-32 rounded-full border-2 border-dashed border-red-400/40"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 6 }}
              aria-hidden
            />
            {/* Outer glow pulse */}
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-3xl shadow-[0_0_48px_0_rgba(239,68,68,0.35)]"
              animate={{ opacity: [0.35, 0.15, 0.35] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
          </>
        )}

        <Button
          variant="default"
          size="icon"
          className={`h-14 w-14 rounded-3xl transition-all duration-150 ${recording ? "bg-red-600 text-white ring-2 ring-red-400/50 shadow-[0_0_36px_-6px_rgba(239,68,68,0.55)]" : ""}`}
          onClick={toggle}
          disabled={disabled || !supported || isStarting}
          aria-busy={isStarting || undefined}
        >
          {recording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        {recording && (
          <motion.div
            className="absolute inset-0 rounded-3xl bg-red-600/15"
            animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.15, 0.55] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      drag
      dragMomentum
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      onDragEnd={(_, info) => {
        // Compute absolute top/left by adding delta to current pos
        setPos((prev) => {
          const pad = 8;
          const size = 56;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const base = prev ?? { x: 0, y: 0 };
          const next = {
            x: Math.max(pad, Math.min(vw - size - pad, base.x + info.delta.x)),
            y: Math.max(pad, Math.min(vh - size - pad, base.y + info.delta.y)),
          };
          localStorage.setItem("voiceButtonPos", JSON.stringify(next));
          return next;
        });
        // small delay to avoid tap triggering after drag
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 50);
      }}
      style={{
        position: "fixed",
        left: (pos?.x ?? 0) + "px",
        top: (pos?.y ?? 0) + "px",
        zIndex: 50,
      }}
      className={className ?? ""}
      aria-label="Drag to reposition the voice button"
    >
      <Button
        variant="default"
        size="icon"
        className={`h-14 w-14 rounded-full ${recording ? "bg-red-600 text-white" : ""}`}
        onMouseDown={start}
        onMouseUp={stop}
        onTouchStart={(e) => {
          e.preventDefault();
          start();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stop();
        }}
        onClick={toggle}
        disabled={disabled || !supported}
      >
        {recording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>

      {/* Concentric rings while recording (floating) */}
      {recording && (
        <>
          {/* Soft inner pulse */}
          <motion.span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full bg-red-500/15 blur-sm"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.35, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          {/* Concentric rings */}
          <motion.span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full ring-2 ring-red-500/45"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.25, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-32 rounded-full ring-2 ring-red-500/30"
            animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.15, 0.45] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
            aria-hidden
          />
          {/* Rotating dashed ring */}
          <motion.span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-36 rounded-full border-2 border-dashed border-red-400/40"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 7 }}
            aria-hidden
          />
          {/* Outer glow pulse */}
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_48px_0_rgba(239,68,68,0.35)]"
            animate={{ opacity: [0.35, 0.15, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </>
      )}
    </motion.div>
  );
}