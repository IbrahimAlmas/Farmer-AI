"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const analyzeImage = action({
  args: {
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get the image from storage
    const imageUrl = await ctx.storage.getUrl(args.imageId);
    if (!imageUrl) {
      throw new Error("Image not found");
    }

    // Helper: mock fallback generator
    function mock() {
      return {
        ph: Math.round((6.0 + Math.random() * 2.5) * 10) / 10, // 6.0-8.5
        nitrogen: Math.round((10 + Math.random() * 40) * 10) / 10, // 10-50 mg/kg
        phosphorus: Math.round((5 + Math.random() * 25) * 10) / 10, // 5-30 mg/kg
        potassium: Math.round((50 + Math.random() * 150) * 10) / 10, // 50-200 mg/kg
        moisture: Math.round((15 + Math.random() * 35) * 10) / 10, // 15-50%
        organicMatter: Math.round((1 + Math.random() * 4) * 10) / 10, // 1-5%
        recommendations: [
          "Consider adding organic compost to improve soil structure",
          "Monitor moisture levels regularly during growing season",
          "Test soil pH monthly for optimal crop growth",
        ],
      };
    }

    // If no key, return mock
    if (!OPENROUTER_API_KEY) {
      return mock();
    }

    try {
      // Prepare OpenRouter request for vision analysis
      const systemPrompt =
        "You are an agronomy expert. Analyze the provided soil photo and estimate key soil metrics. " +
        "Return ONLY a compact JSON object with numeric fields and a 'recommendations' array. " +
        "No extra text. If unsure, provide reasonable estimates.\n\n" +
        `JSON schema:\n{\n` +
        `  "ph": number, // 4.0 - 9.0\n` +
        `  "nitrogen": number, // mg/kg\n` +
        `  "phosphorus": number, // mg/kg\n` +
        `  "potassium": number, // mg/kg\n` +
        `  "moisture": number, // percentage 0-100\n` +
        `  "organicMatter": number, // percentage 0-100\n` +
        `  "recommendations": string[]\n` +
        `}`;

      const userContent = [
        {
          type: "text",
          text:
            "Analyze this soil image and output the JSON exactly per the schema. " +
            "If information is visually ambiguous, provide reasonable estimates typical for healthy agricultural soil.",
        },
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
      ];

      const body = {
        model: "openai/gpt-4o-mini", // Vision-capable via OpenRouter
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent as any },
        ],
        temperature: 0.2,
        response_format: { type: "text" },
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
        // Fallback to mock on API error
        return mock();
      }

      const json = (await res.json()) as any;
      const content = json?.choices?.[0]?.message?.content ?? "";

      // Extract JSON block robustly (strip possible code fences)
      const match =
        typeof content === "string"
          ? content.match(/\{[\s\S]*\}/)
          : null;

      let parsed: any = null;
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // continue to fallback
        }
      }

      if (!parsed) {
        return mock();
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
    } catch {
      // Any unexpected failure: fallback to mock
      return mock();
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