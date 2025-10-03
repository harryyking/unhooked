// convex/user.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Mutation to create or update a user
export const createOrUpdateUser = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrlId: v.optional(v.id("_storage")),
    email: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("No tokenIdentifier provided");

    // Inline query to avoid internalQuery call issues
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name ?? existingUser.name,
        avatarUrlId: args.avatarUrlId ?? existingUser.avatarUrlId,
        email: args.email ?? existingUser.email,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      tokenIdentifier,
      name: args.name,
      avatarUrlId: args.avatarUrlId,
      email: args.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mutation to update user profile
export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrlId: v.optional(v.id("_storage")),
    email: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("No tokenIdentifier provided");

    // Inline query for user lookup
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    // Check for unique name if provided
    if (args.name && args.name !== user.name) {
      const existingName = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();
      if (existingName && existingName._id !== user._id) {
        throw new Error("Username already taken");
      }
    }

    await ctx.db.patch(user._id, {
      name: args.name ?? user.name,
      avatarUrlId: args.avatarUrlId ?? user.avatarUrlId,
      email: args.email ?? user.email,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Mutation to generate upload URL for avatar
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Mutation to save uploaded avatar
export const saveAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("No tokenIdentifier provided");

    // Inline query for user lookup
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      avatarUrlId: args.storageId,
      updatedAt: Date.now(),
    });

    return args.storageId;
  },
});

// Mutation to save preference
export const savePreference = mutation({
  args: {
    preferredBibleVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("No tokenIdentifier provided");

    // Inline query for user lookup
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      preferredBibleVersion: args.preferredBibleVersion,
      updatedAt: Date.now(),
    });
  },
});