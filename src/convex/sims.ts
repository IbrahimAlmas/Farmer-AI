import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Add helper to use a Test User when unauthenticated
async function getOrCreateTestUserId(ctx: any) {
  const email = "test@demo.local";
  const existing =
    (await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .unique()
      .catch(() => null)) || null;
  if (existing) return existing._id;
  const id = await ctx.db.insert("users", { email, name: "Test User" });
  return id;
}

// Add a query-safe helper for queries only
async function getTestUserIdIfExists(ctx: any) {
  const email = "test@demo.local";
  const existing =
    (await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .unique()
      .catch(() => null)) || null;
  return existing?._id ?? null;
}

// Enhanced farming simulation catalogs
const IRRIGATION_METHODS = {
  drip: { efficiency: 0.9, name: "Drip Irrigation" },
  sprinkler: { efficiency: 0.75, name: "Sprinkler System" },
  flood: { efficiency: 0.55, name: "Flood Irrigation" }
} as const;

const SEED_CATALOG = {
  wheat: { 
    name: "Winter Wheat", 
    daysToMaturity: 120, 
    kc: { seedling: 0.35, vegetative: 0.9, flowering: 1.15, maturity: 0.25 }
  },
  rice: { 
    name: "Basmati Rice", 
    daysToMaturity: 140, 
    kc: { seedling: 1.0, vegetative: 1.05, flowering: 1.2, maturity: 0.9 }
  },
  maize: { 
    name: "Sweet Corn", 
    daysToMaturity: 90, 
    kc: { seedling: 0.3, vegetative: 0.85, flowering: 1.2, maturity: 0.35 }
  },
  soybean: { 
    name: "Soybean", 
    daysToMaturity: 110, 
    kc: { seedling: 0.35, vegetative: 0.95, flowering: 1.15, maturity: 0.5 }
  },
  canola: { 
    name: "Canola", 
    daysToMaturity: 100, 
    kc: { seedling: 0.4, vegetative: 0.95, flowering: 1.1, maturity: 0.5 }
  }
} as const;

export const get = query({
  args: { farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getTestUserIdIfExists(ctx));
    if (args.farmId) {
      const existing = await ctx.db
        .query("sims")
        .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
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
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const existing = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
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

export const setIrrigationMethod = mutation({
  args: { method: v.string(), farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    
    // Validate irrigation method
    if (!Object.keys(IRRIGATION_METHODS).includes(args.method)) {
      throw new Error("Invalid irrigation method");
    }
    
    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);
          
    if (!sim) throw new Error("Simulation not initialized");
    
    await ctx.db.patch(sim._id, {
      irrigationMethod: args.method,
    });
    
    return { success: true, method: args.method };
  },
});

export const sowSeed = mutation({
  args: { seedKey: v.string(), farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    
    // Validate seed key
    if (!Object.keys(SEED_CATALOG).includes(args.seedKey)) {
      throw new Error("Invalid seed type");
    }
    
    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);
          
    if (!sim) throw new Error("Simulation not initialized");
    
    const seedCost = 200;
    if (sim.balance < seedCost) throw new Error("Insufficient balance to sow seeds");
    
    const seedData = SEED_CATALOG[args.seedKey as keyof typeof SEED_CATALOG];
    
    await ctx.db.patch(sim._id, {
      crop: args.seedKey,
      seed: {
        key: args.seedKey,
        name: seedData.name,
        daysToMaturity: seedData.daysToMaturity,
        kc: seedData.kc
      },
      stage: "seedling",
      growth: 0,
      health: 85 + Math.floor(Math.random() * 15), // 85-100
      nutrients: { n: 60, p: 40, k: 40 }, // baseline nutrients
      balance: sim.balance - seedCost,
      lastTick: Date.now(),
    });
    
    return { success: true, seedName: seedData.name };
  },
});

export const irrigate = mutation({
  args: { mm: v.number(), farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    
    // Validate irrigation amount
    if (args.mm <= 0 || args.mm > 100) {
      throw new Error("Irrigation amount must be between 1-100mm");
    }
    
    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);
          
    if (!sim) throw new Error("Simulation not initialized");
    
    const method = sim.irrigationMethod || "sprinkler";
    const methodData = IRRIGATION_METHODS[method as keyof typeof IRRIGATION_METHODS];
    const effectiveMm = args.mm * methodData.efficiency;
    
    // Calculate soil moisture increase (capped to realistic levels)
    const moistureIncrease = effectiveMm * 0.5;
    const newSoilMoisture = Math.max(10, Math.min(95, sim.soilMoisture + moistureIncrease));
    
    const irrigationCost = Math.ceil(args.mm * 2); // ₹2 per mm
    if (sim.balance < irrigationCost) {
      throw new Error("Insufficient balance for irrigation");
    }
    
    await ctx.db.patch(sim._id, {
      soilMoisture: newSoilMoisture,
      balance: sim.balance - irrigationCost,
      lastIrrigation: {
        method,
        mm: args.mm,
        effectiveMm,
        at: Date.now()
      },
      lastTick: Date.now(),
    });
    
    return { 
      success: true, 
      method: methodData.name, 
      effectiveMm: Math.round(effectiveMm * 10) / 10,
      soilMoisture: Math.round(newSoilMoisture * 10) / 10
    };
  },
});

export const advanceTick = mutation({
  args: { farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
          .unique()
          .catch(() => null)
      : await ctx.db
          .query("sims")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
          .catch(() => null);
    if (!sim) throw new Error("Simulation not initialized");

    // Environmental changes
    const baseDraw = 2 + Math.random() * 4; // 2-6mm ET0-like drawdown
    const precipitation = Math.random() < 0.3 ? Math.random() * 8 : 0; // 30% chance of rain
    const netMoistureLoss = Math.max(0, baseDraw - precipitation) * 0.5;
    let soilMoisture = Math.max(10, Math.min(95, sim.soilMoisture - netMoistureLoss));

    // Growth progression
    let growth = sim.growth || 0;
    let stage = sim.stage;
    let health = sim.health || 85;

    if (sim.seed && growth < 100) {
      const dailyGrowth = 100 / sim.seed.daysToMaturity;
      
      // Growth modifiers based on conditions
      let growthMultiplier = 1.0;
      if (soilMoisture < 35) growthMultiplier *= 0.7; // drought stress
      if (soilMoisture > 85) growthMultiplier *= 0.8; // waterlogged
      if (health < 60) growthMultiplier *= 0.6; // poor health
      
      growth = Math.min(100, growth + (dailyGrowth * growthMultiplier));
      
      // Stage transitions based on growth percentage
      if (growth >= 80 && stage !== "maturity") stage = "maturity";
      else if (growth >= 60 && stage !== "flowering") stage = "flowering";
      else if (growth >= 25 && stage !== "vegetative") stage = "vegetative";
    }

    // Health changes
    if (soilMoisture < 35 || soilMoisture > 85) {
      health = Math.max(20, health - (2 + Math.random() * 3));
    } else {
      health = Math.min(100, health + Math.random() * 2);
    }

    // Weather cycle
    const weatherCycle = ["sunny", "cloudy", "rainy"] as const;
    const nextWeather = weatherCycle[(weatherCycle.indexOf(sim.weather as any) + 1) % weatherCycle.length];
    
    // Maturity bonus (existing logic)
    const yieldBonus = stage === "maturity" && growth >= 95 ? 500 + Math.floor(Math.random() * 500) : 0;
    const balance = sim.balance + yieldBonus;

    await ctx.db.patch(sim._id, {
      stage,
      growth: Math.round(growth * 10) / 10,
      health: Math.round(health * 10) / 10,
      soilMoisture: Math.round(soilMoisture * 10) / 10,
      weather: nextWeather,
      balance,
      lastTick: Date.now(),
    });

    return { success: true, growth, health, soilMoisture };
  },
});

export const plantCrop = mutation({
  args: { crop: v.string(), farmId: v.optional(v.id("farms")) },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
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
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
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
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const sim = args.farmId
      ? await ctx.db
          .query("sims")
          .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
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