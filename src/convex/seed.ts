import { action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const seedUserData = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.runMutation(internal.seed.createSampleData, { userId });
  },
});

export const createSampleData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Create sample farms
    await ctx.db.insert("farms", {
      userId,
      name: "Main Field",
      location: { lat: 28.6139, lng: 77.2090, address: "Delhi, India" },
      crops: ["wheat", "rice", "sugarcane"],
    });

    await ctx.db.insert("farms", {
      userId,
      name: "Vegetable Garden",
      crops: ["tomato", "onion", "potato", "cabbage"],
    });

    // Create sample tasks
    await ctx.db.insert("tasks", {
      userId,
      title: "Water the crops",
      dueDate: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
      status: "pending",
      notes: "Check soil moisture before watering",
    });

    await ctx.db.insert("tasks", {
      userId,
      title: "Apply fertilizer to wheat field",
      dueDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      status: "pending",
    });

    await ctx.db.insert("tasks", {
      userId,
      title: "Harvest tomatoes",
      status: "done",
      notes: "Harvested 50kg of tomatoes",
    });

    // Create sample market listings
    await ctx.db.insert("market_listings", {
      userId,
      title: "Fresh Wheat",
      price: 25,
      unit: "kg",
      location: "Delhi",
      contact: "9876543210",
      description: "High quality wheat, freshly harvested",
    });

    // Create sample resources
    await ctx.db.insert("resources", {
      title: "Organic Farming Guide",
      summary: "Complete guide to organic farming practices",
      url: "https://example.com/organic-farming",
      tags: ["organic", "farming", "guide"],
    });

    await ctx.db.insert("resources", {
      title: "Crop Rotation Techniques",
      summary: "Learn about effective crop rotation methods",
      url: "https://example.com/crop-rotation",
      tags: ["rotation", "techniques", "soil"],
    });

    await ctx.db.insert("resources", {
      title: "Pest Management",
      summary: "Natural pest control methods for farmers",
      url: "https://example.com/pest-management",
      tags: ["pest", "control", "natural"],
    });

    // Create sample community post
    await ctx.db.insert("community_posts", {
      userId,
      body: "Just harvested my first organic tomato crop! The yield was amazing. Happy to share tips with fellow farmers.",
      likes: 5,
      commentsCount: 2,
    });

    // Create simulation state
    await ctx.db.insert("sims", {
      userId,
      season: "monsoon",
      weather: "rainy",
      soilMoisture: 75,
      crop: "rice",
      stage: "flowering",
      balance: 10000,
      lastTick: Date.now(),
    });

    return { success: true };
  },
});