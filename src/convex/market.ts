import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("market_listings")
      .order("desc")
      .collect();
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("market_listings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    price: v.number(),
    unit: v.string(),
    location: v.optional(v.string()),
    contact: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("market_listings", {
      userId,
      title: args.title,
      price: args.price,
      unit: args.unit,
      location: args.location,
      contact: args.contact,
      description: args.description,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("market_listings"),
    title: v.optional(v.string()),
    price: v.optional(v.number()),
    unit: v.optional(v.string()),
    location: v.optional(v.string()),
    contact: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.id);
    if (!listing || listing.userId !== userId) {
      throw new Error("Listing not found or access denied");
    }

    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("market_listings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.id);
    if (!listing || listing.userId !== userId) {
      throw new Error("Listing not found or access denied");
    }

    return await ctx.db.delete(args.id);
  },
});
