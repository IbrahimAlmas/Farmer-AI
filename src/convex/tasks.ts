import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { taskStatusValidator } from "./schema";

// Add Test User helpers for unauthenticated usage
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

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getTestUserIdIfExists(ctx));
    if (!userId) return [];
    
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const listByFarm = query({
  args: { farmId: v.id("farms") },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getTestUserIdIfExists(ctx));
    if (!userId) return [];
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_farmId", (q) => q.eq("userId", userId).eq("farmId", args.farmId))
      .order("desc")
      .collect();
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getTestUserIdIfExists(ctx));
    if (!userId) return [];
    
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_status", (q) => q.eq("userId", userId).eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    farmId: v.optional(v.id("farms")),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));

    return await ctx.db.insert("tasks", {
      userId,
      title: args.title,
      dueDate: args.dueDate,
      status: "pending",
      notes: args.notes,
      farmId: args.farmId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    status: v.optional(taskStatusValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or access denied");
    }

    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const markDone = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or access denied");
    }

    return await ctx.db.patch(args.id, { status: "done" });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or access denied");
    }

    return await ctx.db.delete(args.id);
  },
});

export const aiSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    // When not authenticated, return demo suggestions so the Tasks page is never empty
    if (!userId) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      // Updated demo plan to target your exact farm names
      const demoPlan: Array<{ at: number; item: string; details: string; technique?: string }> = [
        {
          at: now + 0 * day,
          item: "Plant wheat — Wheat farm",
          details: "Sow certified seeds at 3–5 cm depth; ensure fine tilth.",
          technique: "Direct seeding / seed drill",
        },
        {
          at: now + 1 * day,
          item: "Irrigation — Wheat farm",
          details: "Apply 8–12 mm depending on ET and rainfall.",
          technique: "Drip (preferred) or Sprinkler",
        },
        {
          at: now + 2 * day,
          item: "Pest scouting — Wheat farm",
          details: "Inspect 10 plants per block; monitor for aphids and rust.",
          technique: "Visual scouting",
        },

        {
          at: now + 0 * day,
          item: "Plant barley — Barely",
          details: "Sow barley at 3–4 cm; maintain uniform spacing.",
          technique: "Direct seeding",
        },
        {
          at: now + 1 * day,
          item: "Irrigation — Barely",
          details: "Apply 6–10 mm based on forecast and soil moisture.",
          technique: "Sprinkler preferred",
        },
        {
          at: now + 2 * day,
          item: "Pest scouting — Barely",
          details: "Check edges for aphids; sample across rows.",
          technique: "Visual scouting",
        },

        {
          at: now + 0 * day,
          item: "Transplant rice — Rice",
          details: "Transplant healthy seedlings; ensure puddled bed.",
          technique: "Transplanting",
        },
        {
          at: now + 1 * day,
          item: "Irrigation — Rice",
          details: "Maintain shallow standing water (2–3 cm).",
          technique: "Flood (field leveling helps)",
        },
        {
          at: now + 2 * day,
          item: "Weed management — Rice",
          details: "Light weeding between rows to reduce competition.",
          technique: "Manual or mechanical",
        },
      ];

      const suggestions = demoPlan.slice(0, 9).map((p, idx) => {
        const lower = p.item.toLowerCase();
        const priority: "high" | "medium" | "low" =
          lower.includes("plant") || lower.includes("irrigation") ? "high" : lower.includes("pest") || lower.includes("weed") ? "medium" : idx === 1 ? "medium" : "low";
        return {
          title: p.item,
          priority,
          reason: p.technique ? `${p.details} (Technique: ${p.technique})` : p.details,
          dueInDays: Math.max(0, Math.round((p.at - Date.now()) / day)),
        };
      });

      return suggestions;
    }

    // Build the same schedule used in `schedule` and derive suggestions from it
    const farms = await ctx.db
      .query("farms")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Helper: plan for a single farm
    function planForFarm(farm: any) {
      const farmName = (farm?.name as string) || "Farm";
      const sizeAcres = (farm?.size as number | undefined) ?? 1;
      const crop = (farm?.previousCrops?.[0] as string | undefined) ?? "wheat";

      return [
        {
          at: now + 0 * day,
          item: `Plant ${crop} — ${farmName}`,
          details: `Direct seeding window begins. Target spacing for ${crop}.`,
          technique: "Direct seeding",
        },
        {
          at: now + 1 * day,
          item: `Irrigation — ${farmName}`,
          details: `Apply 8–12 mm depending on ET and rainfall.`,
          technique: "Drip (preferred) or Sprinkler",
        },
        {
          at: now + 2 * day,
          item: `Pest scouting — ${farmName}`,
          details: "Inspect 10 plants per block; look for aphids and leaf miners.",
          technique: "Visual scouting",
        },
        {
          at: now + 5 * day,
          item: `Fertilization — ${farmName}`,
          details: "Apply light NPK 10-26-26 if growth stalls.",
          technique: "Fertigation via drip",
        },
        {
          at: now + 9 * day,
          item: `Follow-up irrigation — ${farmName}`,
          details: "Re-evaluate soil moisture; apply 10 mm if < 35% VWC.",
          technique: "Drip",
        },
        {
          at: now + 12 * day,
          item: `Weed management — ${farmName}`,
          details: "Spot weeding between rows.",
          technique: "Manual or mechanical",
        },
        {
          at: now + 14 * day,
          item: `Harvest window review — ${farmName}`,
          details: `Check forecast; align best window for ${crop}.`,
          technique: "Field scouting + forecast check",
        },
      ];
    }

    // Limit to first 3 farms for concise plan
    const selected = farms.slice(0, 3);
    const all = selected.flatMap(planForFarm).sort((a, b) => a.at - b.at);

    // Derive 3 suggestions from earliest items and map to priority
    const suggestions = all.slice(0, 6).map((it) => {
      const title = it.item;
      const lower = title.toLowerCase();
      let priority: "high" | "medium" | "low" = "low";
      if (lower.includes("irrigation")) priority = "high";
      else if (lower.includes("pest") || lower.includes("weed")) priority = "medium";
      else if (lower.includes("plant") || lower.includes("fertiliz")) priority = "medium";

      // Due sooner items get smaller dueInDays
      const dueInDays = Math.max(0, Math.round((it.at - now) / day));

      return {
        title,
        priority,
        reason: it.details,
        dueInDays,
      };
    });

    // Keep unique by title and cap to 3
    const seen = new Set<string>();
    const uniqueTop3 = suggestions.filter((s) => {
      if (seen.has(s.title)) return false;
      seen.add(s.title);
      return true;
    }).slice(0, 3);

    return uniqueTop3;
  },
});

export const schedule = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    // When not authenticated, return a comprehensive demo plan for 3 farms
    if (!userId) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      // Updated to your exact farm names
      const demoFarms: Array<{ name: string; crop: string }> = [
        { name: "Wheat farm", crop: "wheat" },
        { name: "Barely", crop: "barley" },
        { name: "Rice", crop: "rice" },
      ];

      function planForFarm(farm: { name: string; crop: string }) {
        const items: Array<{ at: number; item: string; details: string; technique?: string }> = [
          {
            at: now + 0 * day,
            item: `Plant ${farm.crop} — ${farm.name}`,
            details: `Begin planting ${farm.crop}; ensure proper depth and spacing.`,
            technique: "Direct seeding",
          },
          {
            at: now + 1 * day,
            item: `Irrigation — ${farm.name}`,
            details: "Apply 8–12 mm based on ET and forecast.",
            technique: "Drip (preferred) or Sprinkler",
          },
          {
            at: now + 2 * day,
            item: `Pest scouting — ${farm.name}`,
            details: "Inspect leaves and stems; sample 10 plants per block.",
            technique: "Visual scouting",
          },
          {
            at: now + 5 * day,
            item: `Fertilization — ${farm.name}`,
            details: "Apply light NPK 10-26-26 if growth is lagging.",
            technique: "Fertigation via drip",
          },
          {
            at: now + 9 * day,
            item: `Follow-up irrigation — ${farm.name}`,
            details: "Recheck VWC; add 10 mm if < 35%.",
            technique: "Drip",
          },
          {
            at: now + 12 * day,
            item: `Weed management — ${farm.name}`,
            details: "Spot weed between rows to reduce competition.",
            technique: "Manual or mechanical",
          },
          {
            at: now + 14 * day,
            item: `Harvest window review — ${farm.name}`,
            details: `Review forecast and crop progress for ${farm.crop}.`,
            technique: "Field scouting + forecast check",
          },
        ];
        return items;
      }

      const plan = demoFarms.flatMap(planForFarm).sort((a, b) => a.at - b.at);
      return plan;
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Build a detailed 2-week plan per farm (first 3 farms)
    const farms = await ctx.db
      .query("farms")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    function planForFarm(farm: any) {
      const farmName = (farm?.name as string) || "Farm";
      const crop = (farm?.previousCrops?.[0] as string | undefined) ?? "wheat";

      const items: Array<{
        at: number;
        item: string;
        details: string;
        technique?: string;
      }> = [
        {
          at: now + 0 * day,
          item: `Plant ${crop} — ${farmName}`,
          details: `Begin planting ${crop}; ensure proper depth and spacing.`,
          technique: "Direct seeding",
        },
        {
          at: now + 1 * day,
          item: `Irrigation — ${farmName}`,
          details: "Apply 8–12 mm based on ET and forecast.",
          technique: "Drip (preferred) or Sprinkler",
        },
        {
          at: now + 2 * day,
          item: `Pest scouting — ${farmName}`,
          details: "Inspect leaves and stems; sample 10 plants per block.",
          technique: "Visual scouting",
        },
        {
          at: now + 5 * day,
          item: `Fertilization — ${farmName}`,
          details: "Apply light NPK 10-26-26 if growth is lagging.",
          technique: "Fertigation via drip",
        },
        {
          at: now + 9 * day,
          item: `Follow-up irrigation — ${farmName}`,
          details: "Recheck VWC; add 10 mm if < 35%.",
          technique: "Drip",
        },
        {
          at: now + 12 * day,
          item: `Weed management — ${farmName}`,
          details: "Spot weed between rows to reduce competition.",
          technique: "Manual or mechanical",
        },
        {
          at: now + 14 * day,
          item: `Harvest window review — ${farmName}`,
          details: `Review forecast and crop progress for ${crop}.`,
          technique: "Field scouting + forecast check",
        },
      ];

      return items;
    }

    const selected = farms.slice(0, 3);
    const plan = selected.flatMap(planForFarm).sort((a, b) => a.at - b.at);

    return plan;
  },
});

export const createFromSuggestion = mutation({
  args: {
    title: v.string(),
    reason: v.string(),
    priority: v.optional(v.string()),
    dueInDays: v.optional(v.number()),
    farmId: v.optional(v.id("farms")),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));

    const dueDate =
      args.dueInDays != null ? Date.now() + args.dueInDays * 24 * 60 * 60 * 1000 : undefined;

    return await ctx.db.insert("tasks", {
      userId,
      title: args.title,
      dueDate,
      status: "pending",
      notes: args.reason,
      priority: args.priority ?? undefined,
      farmId: args.farmId,
    });
  },
});