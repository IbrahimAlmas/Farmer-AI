import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { taskStatusValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("tasks", {
      userId,
      title: args.title,
      dueDate: args.dueDate,
      status: "pending",
      notes: args.notes,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    if (!userId) return [];

    // Pull a bit of context to tailor suggestions
    const farms = await ctx.db
      .query("farms")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Prefer the first farm for simple tailoring
    const farm = farms[0] ?? null;

    // Lightweight heuristics; if farm exists and size/previousCrops hint wheat/rice, adapt copies
    const hasWheat = !!farm?.previousCrops?.some((c) => c.toLowerCase().includes("wheat"));
    const cropHint = hasWheat ? "wheat" : "your crop";

    const suggestions: Array<{
      title: string;
      priority: "high" | "medium" | "low";
      reason: string;
      dueInDays: number;
    }> = [
      {
        title: "Check Irrigation System",
        priority: "high",
        reason: "Soil moisture may be low; verify lines, emitters, and pressure.",
        dueInDays: 0,
      },
      {
        title: "Pest Scouting in Zone B",
        priority: "medium",
        reason: "Weather favors aphid growth; inspect leaves and stems.",
        dueInDays: 1,
      },
      {
        title: `Fertilize ${cropHint} Fields`,
        priority: "low",
        reason: "Scheduled maintenance feeding for next week.",
        dueInDays: 7,
      },
    ];

    return suggestions;
  },
});

export const schedule = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Simple sample schedule; could be expanded or tied to sims state
    const plan: Array<{
      at: number;
      item: string;
      details: string;
      technique?: string;
    }> = [
      {
        at: now + 0 * day,
        item: "Irrigation check",
        details: "Inspect mainline, flush filters, spot-check moisture at 10 cm.",
        technique: "Drip audit",
      },
      {
        at: now + 1 * day,
        item: "Pest scouting",
        details: "Look for aphids and leaf miners; sample 10 plants per block.",
        technique: "Visual scouting",
      },
      {
        at: now + 2 * day,
        item: "Irrigation",
        details: "Apply 8–12 mm depending on ET and rainfall.",
        technique: "Sprinkler or drip (preferred drip for efficiency)",
      },
      {
        at: now + 5 * day,
        item: "Fertilization",
        details: "Apply NPK 10-26-26 light dose if growth stalls.",
        technique: "Fertigation via drip",
      },
      {
        at: now + 9 * day,
        item: "Weed management",
        details: "Spot weeding between rows.",
        technique: "Manual or mechanical",
      },
      {
        at: now + 12 * day,
        item: "Irrigation",
        details: "Re-evaluate soil moisture; apply 10 mm if < 35% VWC.",
        technique: "Drip",
      },
      {
        at: now + 14 * day,
        item: "Planting window review",
        details: "Check local forecast; best window in next week for wheat if temps 15–25°C.",
        technique: "Direct seeding",
      },
    ];

    return plan.sort((a, b) => a.at - b.at);
  },
});

export const createFromSuggestion = mutation({
  args: {
    title: v.string(),
    reason: v.string(),
    priority: v.optional(v.string()),
    dueInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dueDate =
      args.dueInDays != null ? Date.now() + args.dueInDays * 24 * 60 * 60 * 1000 : undefined;

    return await ctx.db.insert("tasks", {
      userId,
      title: args.title,
      dueDate,
      status: "pending",
      notes: args.reason,
      priority: args.priority ?? undefined,
    });
  },
});