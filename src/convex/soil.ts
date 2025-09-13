"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const analyzeImage = action({
  args: {
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const imageUrl = await ctx.storage.getUrl(args.imageId);
    if (!imageUrl) {
      throw new Error("Image not found");
    }

    // Helper: mock fallback generator (used only when NO API key is configured)
    function mock() {
      return {
        ph: Math.round((6.0 + Math.random() * 2.5) * 10) / 10,
        nitrogen: Math.round((10 + Math.random() * 40) * 10) / 10,
        phosphorus: Math.round((5 + Math.random() * 25) * 10) / 10,
        potassium: Math.round((50 + Math.random() * 150) * 10) / 10,
        moisture: Math.round((15 + Math.random() * 35) * 10) / 10,
        organicMatter: Math.round((1 + Math.random() * 4) * 10) / 10,
        recommendations: [
          "Consider adding organic compost to improve soil structure",
          "Monitor moisture levels regularly during growing season",
          "Test soil pH monthly for optimal crop growth",
        ],
      };
    }

    // If no key, return mock as before
    if (!OPENROUTER_API_KEY) {
      return mock();
    }

    try {
      // Pre-check: Verify the image is a soil photo before analysis
      const verifyPrompt =
        "You are an image verifier. Determine if the provided image is primarily a photo of soil, farmland ground, a soil profile/sample, or soil surface close-up suitable for soil analysis. " +
        "If it's anything else (people, animals, documents, sky, plants/leaves only, buildings, generic scenery, etc.), return isSoil=false. " +
        "Return ONLY strict JSON with exactly these keys and types, no prose: { \"isSoil\": boolean, \"reason\": string }";

      const verifyUserContent = [
        { type: "text", text: "Is this a soil photo suitable for soil analysis? Respond only with JSON." },
        { type: "image_url", image_url: { url: imageUrl } },
      ];

      const verifyBody = {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: verifyPrompt },
          { role: "user", content: verifyUserContent as any },
        ],
        temperature: 0.0,
        response_format: { type: "json_object" },
      };

      const verifyRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify(verifyBody),
      });

      if (!verifyRes.ok) {
        const t = await verifyRes.text().catch(() => "");
        throw new Error(`AI verification failed: ${verifyRes.status} ${t}`);
      }

      const verifyJson = (await verifyRes.json()) as any;
      const verifyContent = verifyJson?.choices?.[0]?.message?.content ?? "";
      let verifyParsed: any = null;
      if (typeof verifyContent === "string") {
        try {
          verifyParsed = JSON.parse(verifyContent);
        } catch {
          const m = verifyContent.match(/\{[\s\S]*\}/);
          if (m) verifyParsed = JSON.parse(m[0]);
        }
      } else if (typeof verifyContent === "object" && verifyContent !== null) {
        verifyParsed = verifyContent;
      }

      if (!verifyParsed || verifyParsed.isSoil !== true) {
        throw new Error("Please add a photo of soil");
      }

      // Strengthened system prompt + strict JSON response
      const systemPrompt =
        "You are an agronomy expert. Analyze the provided soil photo and estimate key soil metrics. " +
        "Return ONLY a compact JSON object with the exact fields and types, no explanations, no markdown. " +
        "If unsure, provide conservative estimates typical for healthy agricultural soil.\n\n" +
        `Required JSON schema (no additional keys):\n{\n` +
        `  "ph": number,\n` +
        `  "nitrogen": number,\n` +
        `  "phosphorus": number,\n` +
        `  "potassium": number,\n` +
        `  "moisture": number,\n` +
        `  "organicMatter": number,\n` +
        `  "recommendations": string[]\n` +
        `}`;

      const userContent = [
        {
          type: "text",
          text:
            "Analyze this soil image and output the JSON exactly per the schema. " +
            "No prose, only JSON. Ensure numeric values are reasonable for agricultural soil.",
        },
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
      ];

      const body = {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent as any },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }, // enforce JSON
      };

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // With API key set, fail loudly to avoid returning dummy data
        const text = await res.text().catch(() => "");
        throw new Error(`AI request failed: ${res.status} ${text}`);
      }

      const json = (await res.json()) as any;
      const content = json?.choices?.[0]?.message?.content ?? "";

      // Parse JSON content directly (response_format enforces JSON string)
      let parsed: any = null;
      if (typeof content === "string") {
        try {
          parsed = JSON.parse(content);
        } catch {
          // try fallback regex in case providers wrap it unexpectedly
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          }
        }
      } else if (typeof content === "object" && content !== null) {
        parsed = content;
      }

      if (!parsed) {
        throw new Error("AI returned an invalid JSON payload");
      }

      // Coerce and clamp values to expected ranges
      const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(max, Number(n)));

      const result = {
        ph: clamp(parsed.ph ?? 6.8, 4, 9),
        nitrogen: Math.max(0, Number(parsed.nitrogen ?? 30)),
        phosphorus: Math.max(0, Number(parsed.phosphorus ?? 15)),
        potassium: Math.max(0, Number(parsed.potassium ?? 120)),
        moisture: clamp(parsed.moisture ?? 30, 0, 100),
        organicMatter: clamp(parsed.organicMatter ?? 3.5, 0, 100),
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.slice(0, 8).map((s: any) => String(s))
          : [
              "Consider adding organic compost to improve soil structure",
              "Monitor moisture levels regularly during growing season",
            ],
      };

      return result;
    } catch (err) {
      // With an API key configured, surface errors so the UI can inform the user.
      throw err instanceof Error ? err : new Error("AI analysis failed");
    }
  },
});

export const analyzeMock = action({
  args: {},
  handler: async () => {
    // Return randomized but realistic soil data without needing an image
    const mockAnalysis = {
      ph: Math.round((6.0 + Math.random() * 2.5) * 10) / 10,
      nitrogen: Math.round((10 + Math.random() * 40) * 10) / 10,
      phosphorus: Math.round((5 + Math.random() * 25) * 10) / 10,
      potassium: Math.round((50 + Math.random() * 150) * 10) / 10,
      moisture: Math.round((15 + Math.random() * 35) * 10) / 10,
      organicMatter: Math.round((1 + Math.random() * 4) * 10) / 10,
      recommendations: [
        "Consider adding organic compost to improve soil structure",
        "Monitor moisture levels regularly during growing season",
        "Test soil pH monthly for optimal crop growth",
      ],
    };
    return mockAnalysis;
  },
});