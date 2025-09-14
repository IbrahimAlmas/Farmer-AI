import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Task status enum
export const TASK_STATUS = {
  PENDING: "pending",
  DONE: "done",
} as const;

export const taskStatusValidator = v.union(
  v.literal(TASK_STATUS.PENDING),
  v.literal(TASK_STATUS.DONE),
);
export type TaskStatus = Infer<typeof taskStatusValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // User profiles with preferences
    profiles: defineTable({
      userId: v.id("users"),
      preferredLang: v.string(),
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
      tutorialCompleted: v.boolean(),
    }).index("by_userId", ["userId"]),

    // Farms owned by users
    farms: defineTable({
      userId: v.id("users"),
      name: v.string(),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
      })),
      crops: v.array(v.string()),
      // Add 3D capture fields
      cornerPhotos: v.optional(v.array(v.id("_storage"))),
      walkPath: v.optional(v.array(v.object({
        lat: v.number(),
        lng: v.number(),
        ts: v.number(),
      }))),
      modelReady: v.optional(v.boolean()),
      // Added fields: size (e.g., acres) and user's previous crops
      size: v.optional(v.number()),
      previousCrops: v.optional(v.array(v.string())),
    }).index("by_userId", ["userId"]),

    // Tasks for users
    tasks: defineTable({
      userId: v.id("users"),
      title: v.string(),
      dueDate: v.optional(v.number()),
      status: taskStatusValidator,
      notes: v.optional(v.string()),
    }).index("by_userId", ["userId"])
     .index("by_userId_and_status", ["userId", "status"]),

    // Market listings
    market_listings: defineTable({
      userId: v.id("users"),
      title: v.string(),
      price: v.number(),
      unit: v.string(),
      location: v.optional(v.string()),
      contact: v.optional(v.string()),
      description: v.optional(v.string()),
    }).index("by_userId", ["userId"]),

    // Learning resources
    resources: defineTable({
      title: v.string(),
      summary: v.string(),
      url: v.string(),
      tags: v.array(v.string()),
    }),

    // Community posts
    community_posts: defineTable({
      userId: v.id("users"),
      body: v.string(),
      images: v.optional(v.array(v.id("_storage"))),
      likes: v.number(),
      commentsCount: v.number(),
    }).index("by_userId", ["userId"]),

    // Comments on posts
    comments: defineTable({
      postId: v.id("community_posts"),
      userId: v.id("users"),
      body: v.string(),
    }).index("by_postId", ["postId"])
     .index("by_userId", ["userId"]),

    // User settings
    settings: defineTable({
      userId: v.id("users"),
      preferences: v.object({
        notifications: v.boolean(),
        darkMode: v.boolean(),
        hapticFeedback: v.boolean(),
      }),
    }).index("by_userId", ["userId"]),

    // Simulation game state
    sims: defineTable({
      userId: v.id("users"),
      // Associate sim with a specific farm if provided
      farmId: v.optional(v.id("farms")),
      season: v.string(),
      weather: v.string(),
      soilMoisture: v.number(),
      crop: v.optional(v.string()),
      stage: v.string(),
      balance: v.number(),
      lastTick: v.number(),
    }).index("by_userId", ["userId"])
     .index("by_userId_and_farmId", ["userId", "farmId"]),

    // Community groups (areas)
    communities: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      state: v.string(),
      district: v.optional(v.string()),
      lat: v.number(),
      lng: v.number(),
      image: v.optional(v.string()),
    })
      .index("by_state", ["state"])
      .index("by_state_and_district", ["state", "district"]),

    // Community memberships
    community_members: defineTable({
      communityId: v.id("communities"),
      userId: v.id("users"),
    })
      .index("by_userId", ["userId"])
      .index("by_communityId", ["communityId"])
      .index("by_communityId_and_userId", ["communityId", "userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;