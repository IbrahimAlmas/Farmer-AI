"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

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

    // Mock soil analysis - in production, this would call an AI service
    // For now, return randomized but realistic soil data
    const mockAnalysis = {
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

    return mockAnalysis;
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