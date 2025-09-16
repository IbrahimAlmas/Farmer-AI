import { action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const seedUserData = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.runMutation(internal.seed.createSampleData, { userId });
  },
});

export const seedCommunityDemo = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.createCommunityDemo, {});
  },
});

export const createSampleData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Create sample farms
    await ctx.db.insert("farms", {
      userId,
      name: "Main Field",
      location: { lat: 28.6139, lng: 77.2090, address: "Delhi, India" },
      crops: ["wheat", "rice", "sugarcane"],
    });

    await ctx.db.insert("farms", {
      userId,
      name: "Vegetable Garden",
      crops: ["tomato", "onion", "potato", "cabbage"],
    });

    // Create sample tasks
    await ctx.db.insert("tasks", {
      userId,
      title: "Water the crops",
      dueDate: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
      status: "pending",
      notes: "Check soil moisture before watering",
    });

    await ctx.db.insert("tasks", {
      userId,
      title: "Apply fertilizer to wheat field",
      dueDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      status: "pending",
    });

    await ctx.db.insert("tasks", {
      userId,
      title: "Harvest tomatoes",
      status: "done",
      notes: "Harvested 50kg of tomatoes",
    });

    // Create sample market listings
    await ctx.db.insert("market_listings", {
      userId,
      title: "Fresh Wheat",
      price: 25,
      unit: "kg",
      location: "Delhi",
      contact: "9876543210",
      description: "High quality wheat, freshly harvested",
    });

    // Create sample resources
    await ctx.db.insert("resources", {
      title: "Organic Farming Guide",
      summary: "Complete guide to organic farming practices",
      url: "https://example.com/organic-farming",
      tags: ["organic", "farming", "guide"],
    });

    await ctx.db.insert("resources", {
      title: "Crop Rotation Techniques",
      summary: "Learn about effective crop rotation methods",
      url: "https://example.com/crop-rotation",
      tags: ["rotation", "techniques", "soil"],
    });

    await ctx.db.insert("resources", {
      title: "Pest Management",
      summary: "Natural pest control methods for farmers",
      url: "https://example.com/pest-management",
      tags: ["pest", "control", "natural"],
    });

    // Create sample community post
    await ctx.db.insert("community_posts", {
      userId,
      body: "Just harvested my first organic tomato crop! The yield was amazing. Happy to share tips with fellow farmers.",
      likes: 5,
      commentsCount: 2,
    });

    // Create simulation state
    await ctx.db.insert("sims", {
      userId,
      season: "monsoon",
      weather: "rainy",
      soilMoisture: 75,
      crop: "rice",
      stage: "flowering",
      balance: 10000,
      lastTick: Date.now(),
    });

    return { success: true };
  },
});

export const createCommunityDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Helper to get or create a user by email
    async function getOrCreateUser(email: string, name: string, image?: string) {
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .order("desc")
        .take(1);
      if (existing.length > 0) return existing[0]._id;

      return await ctx.db.insert("users", {
        email,
        name,
        image,
        isAnonymous: false,
        role: "member",
      } as any);
    }

    // Create demo users
    const u1 = await getOrCreateUser(
      "ravi.kisan@example.com",
      "Ravi Kumar",
      "/assets/Logo_.png"
    );
    const u2 = await getOrCreateUser(
      "anita.farmer@example.com",
      "Anita Singh",
      "/assets/Logo_.png"
    );
    const u3 = await getOrCreateUser(
      "mohan.rao@example.com",
      "Mohan Rao",
      "/assets/Logo_.png"
    );

    // Create a demo community
    const communityId = await ctx.db.insert("communities", {
      name: "Green Fields Farmers",
      description: "Local farmer community to share tips, prices, and best practices.",
      state: "Telangana",
      district: "Ranga Reddy",
      lat: 17.385,
      lng: 78.4867,
      image: "/assets/Soil.webp",
    });

    // Add memberships
    await ctx.db.insert("community_members", { communityId, userId: u1 });
    await ctx.db.insert("community_members", { communityId, userId: u2 });
    await ctx.db.insert("community_members", { communityId, userId: u3 });

    // Helper to add a post
    async function addPost(userId: any, body: string, likes: number) {
      return await ctx.db.insert("community_posts", {
        userId,
        body,
        likes,
        commentsCount: 0,
      });
    }

    // Seed posts (Twitter/X-like short posts)
    const posts: any[] = [];
    posts.push(await addPost(u1, "Sowed maize this week. Any tips for managing early pests organically?", 3));
    posts.push(await addPost(u2, "Drip irrigation saved 20% water on my tomato crop. Highly recommend!", 7));
    posts.push(await addPost(u3, "What's everyone getting for paddy at the local mandi today?", 5));
    posts.push(await addPost(u1, "Tried neem oil spray—worked well against aphids. Reapply after rains.", 2));
    posts.push(await addPost(u2, "Soil test showed low nitrogen. Going with urea split application.", 6));
    posts.push(await addPost(u3, "Mulching with straw really reduced weeds in my chili plot.", 4));
    posts.push(await addPost(u1, "Anyone using raised beds for vegetables? Worth the effort?", 1));
    posts.push(await addPost(u2, "Harvested onions today. Curing under shade before storage.", 8));
    posts.push(await addPost(u3, "Local market price for groundnut seems up this week.", 3));
    posts.push(await addPost(u1, "Rain forecast looks good—planning to transplant paddy tomorrow.", 5));
    posts.push(await addPost(u2, "Intercropping marigold helped reduce nematodes in my okra.", 4));
    posts.push(await addPost(u3, "Which hybrid seed is best for high-yield maize this season?", 2));

    // Helper to add a comment and increment commentsCount
    async function addComment(postId: any, userId: any, body: string) {
      await ctx.db.insert("comments", { postId, userId, body });
      const post = await ctx.db.get(postId);
      if (post) {
        await ctx.db.patch(postId, { commentsCount: (post as any).commentsCount + 1 });
      }
    }

    // Add a few comments on top posts
    if (posts.length >= 2) {
      await addComment(posts[1], u1, "Great! What spacing are you using for the drip lines?");
      await addComment(posts[1], u3, "Agree—helped me too during dry spells.");
    }
    if (posts.length >= 4) {
      await addComment(posts[3], u2, "How often are you spraying neem oil?");
    }
    if (posts.length >= 6) {
      await addComment(posts[5], u1, "Mulch also keeps soil moisture—double benefit!");
    }

    // Seed a few messages in the community chat
    const chatLines: Array<{ userId: any; body: string }> = [
      { userId: u1, body: "Hello everyone! Good to be here." },
      { userId: u2, body: "Welcome! How's the weather in your area?" },
      { userId: u3, body: "Light showers today. Planning to sow next week." },
      { userId: u2, body: "Nice! Don't forget to check seed viability." },
    ];
    for (const m of chatLines) {
      await ctx.db.insert("community_messages", { communityId, userId: m.userId, body: m.body });
    }

    // Seed a couple of job board entries (resume-like)
    await ctx.db.insert("community_jobs", {
      communityId,
      userId: u2,
      name: "Anita Singh",
      contact: "+91-90000-00001",
      role: "Farm helper (weeding, transplanting)",
      details: "Experience: 3+ years in vegetable farming. Available weekdays.",
    });
    await ctx.db.insert("community_jobs", {
      communityId,
      userId: u3,
      name: "Mohan Rao",
      contact: "mohan.rao@example.com",
      role: "Irrigation technician (drip setup)",
      details: "Installed >10 drip systems. Can advise on layout and maintenance.",
    });

    return { success: true, communityId };
  },
});