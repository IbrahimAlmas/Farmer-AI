import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("farms")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    })),
    crops: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("farms", {
      userId,
      name: args.name,
      location: args.location,
      crops: args.crops,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("farms"),
    name: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    })),
    crops: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) {
      throw new Error("Farm not found or access denied");
    }

    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("farms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) {
      throw new Error("Farm not found or access denied");
    }

    return await ctx.db.delete(args.id);
  },
});
