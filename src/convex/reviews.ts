import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    name: v.string(),
    rating: v.number(), // 1..5
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const { name, rating, comment } = args;
    if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
    await ctx.db.insert("reviews", { name, rating, comment });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Return latest 50 reviews (default creation time order asc -> override to desc)
    return await ctx.db.query("reviews").order("desc").take(50);
  },
});
