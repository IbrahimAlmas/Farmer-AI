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
