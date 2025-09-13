import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let resources = await ctx.db.query("resources").collect();
    
    if (args.tag) {
      resources = resources.filter(resource => 
        resource.tags.includes(args.tag!)
      );
    }
    
    return resources;
  },
});

export const getTags = query({
  args: {},
  handler: async (ctx) => {
    const resources = await ctx.db.query("resources").collect();
    const allTags = resources.flatMap(r => r.tags);
    return [...new Set(allTags)];
  },
});
