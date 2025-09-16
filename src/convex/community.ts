import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("community_posts")
      .order("desc")
      .collect();

    // Get user info for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
          user: user ? { name: user.name || "Anonymous", image: user.image } : null,
        };
      })
    );

    return postsWithUsers;
  },
});

export const create = mutation({
  args: {
    body: v.string(),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("community_posts", {
      userId,
      body: args.body,
      images: args.images,
      likes: 0,
      commentsCount: 0,
    });
  },
});

export const like = mutation({
  args: { id: v.id("community_posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");

    return await ctx.db.patch(args.id, { likes: post.likes + 1 });
  },
});

export const getComments = query({
  args: { postId: v.id("community_posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();

    // Get user info for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: user ? { name: user.name || "Anonymous", image: user.image } : null,
        };
      })
    );

    return commentsWithUsers;
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("community_posts"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Insert comment
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      userId,
      body: args.body,
    });

    // Update comment count
    await ctx.db.patch(args.postId, { commentsCount: post.commentsCount + 1 });

    return commentId;
  },
});

export const listMessages = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("community_messages")
      .withIndex("by_communityId", (q) => q.eq("communityId", args.communityId))
      .order("desc")
      .take(50);

    const withUsers = await Promise.all(
      rows.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          user: user ? { name: user.name || "Anonymous", image: user.image } : null,
        };
      })
    );

    // Return ascending by creation time for display (reverse the taken desc)
    return withUsers.reverse();
  },
});

export const sendMessage = mutation({
  args: { communityId: v.id("communities"), body: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (!args.body.trim()) throw new Error("Message cannot be empty");

    return await ctx.db.insert("community_messages", {
      communityId: args.communityId,
      userId,
      body: args.body,
    });
  },
});

export const listJobs = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("community_jobs")
      .withIndex("by_communityId", (q) => q.eq("communityId", args.communityId))
      .order("desc")
      .collect();

    const withUsers = await Promise.all(
      rows.map(async (j) => {
        const user = await ctx.db.get(j.userId);
        return {
          ...j,
          user: user ? { name: user.name || "Anonymous", image: user.image } : null,
        };
      })
    );
    return withUsers;
  },
});

export const addJob = mutation({
  args: {
    communityId: v.id("communities"),
    name: v.string(),
    contact: v.string(),
    role: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("community_jobs", {
      communityId: args.communityId,
      userId,
      name: args.name,
      contact: args.contact,
      role: args.role,
      details: args.details,
    });
  },
});

export const groupListNearby = query({
  args: { state: v.string(), district: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const districtVal = args.district ?? null;

    let results = await ctx.db
      .query("communities")
      .withIndex("by_state_and_district", (q) =>
        q.eq("state", args.state).eq("district", districtVal ?? undefined)
      )
      .take(2);

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

export const groupMyMembership = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Fetch the most recent membership instead of unique()
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

export const groupJoin = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
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

export const groupCreate = mutation({
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

    await ctx.db.insert("community_members", { communityId, userId });

    return communityId;
  },
});