import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    if (args.farmId) {
      const existing = await ctx.db
        .query("sims")
        .withIndex("by_userId_and_farmId", (q) =>
          q.eq("userId", userId).eq("farmId", args.farmId),
        )
        .unique()
        .catch(() => null);
      return existing ?? null;
    }

    const existing = await ctx.db
      .query("sims")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
      .catch(() => null);
    return existing ?? null;
  },
});

export const ensure = mutation({
  args: { farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) =>
            q.eq("userId", userId).eq("farmId", args.farmId),
          )
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);

    if (existing) return existing;

    const _id = await ctx.db.insert("sims", {
      userId,
      farmId: args.farmId,
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
  args: { farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) =>
            q.eq("userId", userId).eq("farmId", args.farmId),
          )
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);

    if (!sim) throw new Error("Simulation not initialized");

    const stages = ["seedling", "vegetative", "flowering", "maturity"] as const;
    const nextStage =
      stages[Math.min(stages.indexOf(sim.stage as any) + 1, stages.length - 1)];

    const deltaMoisture = Math.round((Math.random() * 10 - 5) * 10) / 10;
    const soilMoisture = Math.max(10, Math.min(95, sim.soilMoisture + deltaMoisture));

    const weatherCycle = ["sunny", "cloudy", "rainy"] as const;
    const nextWeather =
      weatherCycle[(weatherCycle.indexOf(sim.weather as any) + 1) % weatherCycle.length];

    const yieldBonus =
      nextStage === "maturity" ? 500 + Math.floor(Math.random() * 500) : 0;
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
  args: { crop: v.string(), farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) =>
            q.eq("userId", userId).eq("farmId", args.farmId),
          )
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);
    if (!sim) throw new Error("Simulation not initialized");

    const seedCost = 200;
    if (sim.balance < seedCost) throw new Error("Insufficient balance to plant");

    await ctx.db.patch(sim._id, {
      crop: args.crop,
      stage: "seedling",
      balance: sim.balance - seedCost,
      lastTick: Date.now(),
    });

    return { success: true };
  },
});

export const water = mutation({
  args: { farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) =>
            q.eq("userId", userId).eq("farmId", args.farmId),
          )
          .unique()
          .catch(() => null)
      : await ctx.db
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

export const harvest = mutation({
  args: { farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) =>
            q.eq("userId", userId).eq("farmId", args.farmId),
          )
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);
    if (!sim) throw new Error("Simulation not initialized");

    if (!sim.crop) throw new Error("No crop to harvest");
    if (sim.stage !== "maturity") throw new Error("Crop not ready for harvest");

    const base = 1500;
    const variance = Math.floor(Math.random() * 1000);
    const moistureBonus = Math.round((sim.soilMoisture - 50) * 5);
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