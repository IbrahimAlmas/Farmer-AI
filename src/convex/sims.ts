import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const existing = await ctx.db
      .query("sims")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
      .catch(() => null);

    // Only read here; don't insert in a query
    return existing ?? null;
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("sims")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
      .catch(() => null);

    if (existing) return existing;

    const _id = await ctx.db.insert("sims", {
      userId,
      season: "monsoon",
      weather: "rainy",
      soilMoisture: 70,
      crop: "rice",
      stage: "seedling",
      balance: 10000,
      lastTick: Date.now(),
    });

    const created = await ctx.db.get(_id);
    return created!;
  },
});

export const advanceTick = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = await ctx.db
      .query("sims")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
      .catch(() => null);

    if (!sim) {
      throw new Error("Simulation not initialized");
    }

    // Very simple deterministic updates for a "day"
    const stages = ["seedling", "vegetative", "flowering", "maturity"] as const;
    const nextStage =
      stages[Math.min(stages.indexOf(sim.stage as any) + 1, stages.length - 1)];

    const deltaMoisture = Math.round((Math.random() * 10 - 5) * 10) / 10; // -5..+5
    const soilMoisture = Math.max(10, Math.min(95, sim.soilMoisture + deltaMoisture));

    const weatherCycle = ["sunny", "cloudy", "rainy"] as const;
    const nextWeather =
      weatherCycle[(weatherCycle.indexOf(sim.weather as any) + 1) % weatherCycle.length];

    const yieldBonus = nextStage === "maturity" ? 500 + Math.floor(Math.random() * 500) : 0;
    const balance = sim.balance + yieldBonus;

    await ctx.db.patch(sim._id, {
      stage: nextStage,
      soilMoisture,
      weather: nextWeather,
      balance,
      lastTick: Date.now(),
    });

    return { success: true };
  },
});

export const plantCrop = mutation({
  args: { crop: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = await ctx.db
      .query("sims")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
      .catch(() => null);
    if (!sim) throw new Error("Simulation not initialized");

    // Basic economics
    const seedCost = 200;

    if (sim.balance < seedCost) {
      throw new Error("Insufficient balance to plant");
    }

    await ctx.db.patch(sim._id, {
      crop: args.crop,
      stage: "seedling",
      balance: sim.balance - seedCost,
      lastTick: Date.now(),
    });

    return { success: true };
  },
});

// Watering increases soil moisture at a small cost
export const water = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = await ctx.db
      .query("sims")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
      .catch(() => null);
    if (!sim) throw new Error("Simulation not initialized");

    const waterCost = 20;
    if (sim.balance < waterCost) throw new Error("Insufficient balance to water");

    const soilMoisture = Math.min(95, sim.soilMoisture + 10);

    await ctx.db.patch(sim._id, {
      soilMoisture,
      balance: sim.balance - waterCost,
      lastTick: Date.now(),
    });

    return { success: true };
  },
});

// Harvest only at maturity; resets crop and grants income
export const harvest = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = await ctx.db
      .query("sims")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
      .catch(() => null);
    if (!sim) throw new Error("Simulation not initialized");

    if (!sim.crop) throw new Error("No crop to harvest");
    if (sim.stage !== "maturity") throw new Error("Crop not ready for harvest");

    // Simple randomized yield
    const base = 1500;
    const variance = Math.floor(Math.random() * 1000); // 0..999
    const moistureBonus = Math.round((sim.soilMoisture - 50) * 5); // +/- around moisture
    const payout = Math.max(500, base + variance + moistureBonus);

    await ctx.db.patch(sim._id, {
      crop: undefined,
      stage: "seedling",
      balance: sim.balance + payout,
      lastTick: Date.now(),
    });

    return { success: true, payout };
  },
});