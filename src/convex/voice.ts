"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

function getSarvamApiKey() {
  const key = process.env.SARVAM_API_KEY || process.env.SARVAMAI_KEY;
  if (!key) {
    throw new Error("Missing SARVAM_API_KEY environment variable for Sarvam AI.");
  }
  return key;
}

// Helper: fetch wrapper with Sarvam auth
async function sarvamFetch(path: string, init: RequestInit) {
  const url = `https://api.sarvam.ai${path}`;
  const apiKey = getSarvamApiKey();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Sarvam API error ${res.status}: ${body}`);
  }
  return res;
}

/**
 * Text-to-Speech
 * Args:
 *  - text: string to synthesize
 *  - language: BCP-47 or locale (e.g., "ta-IN", "hi-IN", "te-IN"), defaults to "en-IN"
 *  - voice: optional voice hint (e.g., "male" | "female") for future model configs
 * Returns base64 audio (mp3) string
 */
export const tts = action({
  args: {
    text: v.string(),
    language: v.optional(v.string()),
    voice: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const language = args.language ?? "en-IN";

    // Example Sarvam TTS endpoint payload (subject to provider specifics)
    const payload = {
      // Model ids are illustrative; adjust to your Sarvam account/models
      model: "bulbul:v2",
      input: {
        text: args.text,
        language,
      },
      output_format: {
        container: "mp3",
      },
    };

    const res = await sarvamFetch(`/speech/tts`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Expecting binary audio; convert to base64 for the client
    const arrayBuf = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    return base64;
  },
});

/**
 * Speech-to-Text
 * Args:
 *  - audio: binary audio buffer (ArrayBuffer) from MediaRecorder (webm/ogg preferred)
 *  - language: BCP-47 or locale, e.g., "ta-IN"
 * Returns text transcription string
 */
export const stt = action({
  args: {
    audio: v.bytes(),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const language = args.language ?? "en-IN";

    // Using multipart/form-data for audio upload if required by provider
    const formDataBoundary = `----convexboundary${Math.random().toString(16).slice(2)}`;
    const boundary = `--${formDataBoundary}`;
    const ending = `--${formDataBoundary}--`;

    // Build multipart body manually (Node fetch FormData may not be available in all runtimes)
    const parts: Buffer[] = [];

    function pushTextField(name: string, value: string) {
      parts.push(Buffer.from(`${boundary}\r\n`));
      parts.push(
        Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`),
      );
      parts.push(Buffer.from(`${value}\r\n`));
    }

    function pushFileField(name: string, filename: string, contentType: string, data: ArrayBuffer) {
      parts.push(Buffer.from(`${boundary}\r\n`));
      parts.push(
        Buffer.from(
          `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`,
        ),
      );
      parts.push(Buffer.from(`Content-Type: ${contentType}\r\n\r\n`));
      parts.push(Buffer.from(data));
      parts.push(Buffer.from(`\r\n`));
    }

    // Hypothetical model name; adjust to your Sarvam account/models
    pushTextField("model", "saarika:v2");
    pushTextField("language", language);
    pushFileField("audio", "audio.webm", "audio/webm", args.audio);

    parts.push(Buffer.from(`${ending}\r\n`));
    const body = Buffer.concat(parts);

    const res = await sarvamFetch(`/speech/stt`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formDataBoundary}`,
      },
    });

    const json = (await res.json()) as { text?: string; transcript?: string };
    const text = json.text ?? json.transcript ?? "";
    return text;
  },
});