// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Better Auth required tables (added for completeness; adjust if Better Auth adapter handles them automatically)
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrlId: v.optional(v.id("_storage")),
    preferredBibleVersion: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeen: v.optional(v.number()),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_email', ['email']),

  accounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    tokenType: v.optional(v.string()),
    scope: v.optional(v.string()),
    idToken: v.optional(v.string()),
    sessionState: v.optional(v.string()),
  })
    .index('by_userId', ['userId'])
    .index('by_provider_providerAccountId', ['provider', 'providerAccountId']),

  sessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index('by_userId', ['userId']),

  verification: defineTable({
    identifier: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index('by_identifier_token', ['identifier', 'token']),

  // Your other tables
  progress: defineTable({
    userId: v.id("users"),
    logDate: v.string(),
    streak: v.number(),
    clean: v.boolean(),
    journal: v.optional(v.string()),
    mood: v.optional(v.union(
      v.literal("Joyful"),
      v.literal("Hopeful"),
      v.literal("Tempted"),
      v.literal("Struggling"),
      v.literal("Peaceful")
    )),
    triggers: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId_logDate', ['userId', 'logDate'])
    .index('by_streak', ['streak']),

  devotionals: defineTable({
    verses: v.string(),
  }),

  stories: defineTable({
    userId: v.id("users"),
    author: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.union(v.literal("Passion Story"), v.literal("Testimony")),
    readTime: v.string(),
    upvotes: v.number(),
    comments: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_createdAt", ["createdAt"])
    .index("by_upvotes", ["upvotes"]),

  upvotes: defineTable({
    userId: v.id("users"),
    storyId: v.id('stories'),
  })
    .index('by_storyId', ['storyId'])
    .index('by_userId_storyId', ['userId', 'storyId']),

  partnerships: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('declined')),
    createdAt: v.number(),
  })
    .index('by_user1Id', ['user1Id'])
    .index('by_user2Id', ['user2Id']),

  messages: defineTable({
    partnershipId: v.id('partnerships'),
    senderId: v.optional(v.id('users')),
    content: v.string(),
    timestamp: v.number(),
    readAt: v.optional(v.number()),
  }).index('by_partnershipId_timestamp', ['partnershipId', 'timestamp']),

  invites: defineTable({
    inviterId: v.id('users'),
    code: v.string(),
    expiresAt: v.optional(v.number()),
    usedBy: v.optional(v.id('users')),
    createdAt: v.number(),
  }).index('by_code', ['code']),

  comments: defineTable({
    authorId: v.id("users"),
    storyId: v.id("stories"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_storyId", ["storyId"]),

  resources: defineTable({
    title: v.string(),
    storageId: v.id('_storage'), 
  })
});