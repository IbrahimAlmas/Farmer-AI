import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const create = mutation({
  args: {
    preferredLang: v.string(),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      state: v.optional(v.string()),
    })),
    tutorialCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("profiles", {
      userId,
      preferredLang: args.preferredLang,
      location: args.location,
      tutorialCompleted: args.tutorialCompleted,
    });
  },
});

export const update = mutation({
  args: {
    preferredLang: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      state: v.optional(v.string()),
    })),
    voice: v.optional(v.object({
      speed: v.number(),
      pitch: v.number(),
      gender: v.optional(v.string()),
    })),
    tutorialCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    return await ctx.db.patch(profile._id, args);
  },
});
