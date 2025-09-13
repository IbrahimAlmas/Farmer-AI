import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  onTranscript?: (text: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  disabled?: boolean;
  className?: string;
  transcribe: (args: { audio: ArrayBuffer; language?: string }) => Promise<string>;
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

  useEffect(() => {
    setSupported(typeof MediaRecorder !== "undefined");
  }, []);

  async function start() {
    if (!supported || disabled) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const buf = await blob.arrayBuffer();
      try {
        const text = await transcribe({ audio: buf, language });
        onTranscript?.(text);
      } catch (e) {
        console.error("Transcription failed", e);
      }
      (stream.getTracks() || []).forEach((t) => t.stop());
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    onRecordingChange?.(true);
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    onRecordingChange?.(false);
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${className ?? ""}`}
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
