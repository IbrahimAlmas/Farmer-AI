import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Add helper to use a Test User when unauthenticated
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

/** Create or return the Test User for mutations when unauthenticated */
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
    // New optional inputs
    size: v.optional(v.number()),
    previousCrops: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    return await ctx.db.insert("farms", {
      userId,
      name: args.name,
      location: args.location,
      crops: args.crops,
      size: args.size,
      previousCrops: args.previousCrops,
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
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
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
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) {
      throw new Error("Farm not found or access denied");
    }
    return await ctx.db.delete(args.id);
  },
});

export const setCornerPhotos = mutation({
  args: {
    id: v.id("farms"),
    photoIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) throw new Error("Farm not found or access denied");
    await ctx.db.patch(args.id, { cornerPhotos: args.photoIds.slice(0, 1) });
    return { success: true };
  },
});

export const setWalkPath = mutation({
  args: {
    id: v.id("farms"),
    path: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      ts: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) throw new Error("Farm not found or access denied");
    await ctx.db.patch(args.id, { walkPath: args.path.slice(0, 2048) });
    return { success: true };
  },
});

export const finalizeModel = mutation({
  args: { id: v.id("farms") },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getOrCreateTestUserId(ctx));
    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) throw new Error("Farm not found or access denied");
    if (!farm.cornerPhotos || farm.cornerPhotos.length < 1) {
      throw new Error("Please add a field photo first");
    }
    await ctx.db.patch(args.id, { modelReady: true });
    return { success: true };
  },
});

export const authStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return { authenticated: !!userId };
  },
});

export const getById = query({
  args: { id: v.id("farms") },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getTestUserIdIfExists(ctx));
    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) throw new Error("Farm not found or access denied");
    return farm;
  },
});

// Internal: fetch a farm and ensure the current user owns it
export const ownedFarm = internalQuery({
  args: { id: v.id("farms") },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? (await getTestUserIdIfExists(ctx));
    const farm = await ctx.db.get(args.id);
    if (!farm || farm.userId !== userId) throw new Error("Farm not found or access denied");
    return farm;
  },
});

// Internal: set Meshy model metadata/status on a farm
export const setModelMeta = internalMutation({
  args: {
    id: v.id("farms"),
    modelStatus: v.optional(v.string()),
    modelUrl: v.optional(v.string()),
    modelPreviewUrl: v.optional(v.string()),
    meshyTaskId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return { success: true };
  },
});