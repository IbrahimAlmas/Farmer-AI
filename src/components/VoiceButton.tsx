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
};

export default function VoiceButton({
  onTranscript,
  onRecordingChange,
  disabled,
  className,
  transcribe,
  language,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeRef = useRef<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setSupported(typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Initialize position from localStorage or sensible default (bottom-center)
  useEffect(() => {
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
  }, []);

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
      toast.error(err?.message ?? "Microphone permission denied");
      console.error("Failed to start recording", err);
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
    if (isDraggingRef.current) return;
    if (!recording) start();
    else stop();
  };

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
      {recording && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-600/20"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}