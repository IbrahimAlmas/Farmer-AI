import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List up to 2 communities for a given state/district with member counts
export const listNearby = query({
  args: { state: v.string(), district: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const districtVal = args.district ?? null;

    // Prefer district-matched communities
    let results = await ctx.db
      .query("communities")
      .withIndex("by_state_and_district", (q) =>
        q.eq("state", args.state).eq("district", districtVal ?? undefined)
      )
      .take(2);

    // If district match yields fewer than 2, fill with state-only (excluding already included)
    if (results.length < 2) {
      const ids = new Set(results.map((c) => c._id));
      const stateOnly = await ctx.db
        .query("communities")
        .withIndex("by_state", (q) => q.eq("state", args.state))
        .take(4);
      for (const c of stateOnly) {
        if (results.length >= 2) break;
        if (!ids.has(c._id)) results.push(c);
      }
    }

    // Attach member counts
    const withCounts = await Promise.all(
      results.map(async (c) => {
        let count = 0;
        for await (const _m of ctx.db
          .query("community_members")
          .withIndex("by_communityId", (q) => q.eq("communityId", c._id))) {
          count++;
          if (count >= 9999) break;
        }
        return { ...c, membersCount: count };
      })
    );
    return withCounts;
  },
});

// Current user's membership + community
export const myMembership = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Fetch the most recent membership instead of requiring unique()
    const memberships = await ctx.db
      .query("community_members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);

    const membership = memberships[0];
    if (!membership) return null;

    const community = await ctx.db.get(membership.communityId);
    return community ? { membershipId: membership._id, community } : null;
  },
});

// Join a community
export const join = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // Avoid duplicate membership
    const existing = await ctx.db
      .query("community_members")
      .withIndex("by_communityId_and_userId", (q) =>
        q.eq("communityId", args.communityId).eq("userId", userId)
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("community_members", {
      communityId: args.communityId,
      userId,
    });
  },
});

// Create a community in the user's area, enforce max two per area
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    state: v.string(),
    district: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const districtVal = args.district ?? null;

    // Count existing in exact area (state + district match)
    let count = 0;
    for await (const _c of ctx.db
      .query("communities")
      .withIndex("by_state_and_district", (q) =>
        q.eq("state", args.state).eq("district", districtVal ?? undefined)
      )) {
      count++;
      if (count >= 2) break;
    }
    if (count >= 2) {
      throw new Error("Area already has two communities");
    }

    const communityId = await ctx.db.insert("communities", {
      name: args.name,
      description: args.description,
      state: args.state,
      district: districtVal ?? undefined,
      lat: args.lat,
      lng: args.lng,
      image: args.image,
    });

    // Auto-join creator
    await ctx.db.insert("community_members", { communityId, userId });

    return communityId;
  },
});