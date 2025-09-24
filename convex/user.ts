import { v } from "convex/values";
import { internalQuery, mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to get user by tokenIdentifier
export async function userByExternalId(ctx: QueryCtx, tokenIdentifier: string) {
  return await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("tokenIdentifier"), tokenIdentifier))
    .unique();
}

// Query to get the current authenticated user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // No authenticated user
    }

    return await userByExternalId(ctx, identity.tokenIdentifier);
  },
});

// Mutation to create or update a user with Clerk's tokenIdentifier
export const createOrUpdateUser = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrlId: v.optional(v.id("_storage")),
    orgId: v.optional(v.string()),
    email:v.optional(v.string())
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("No tokenIdentifier provided by Clerk");

    const existingUser = await userByExternalId(ctx, tokenIdentifier);

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name ?? existingUser.name,
        avatarUrlId: args.avatarUrlId ?? existingUser.avatarUrlId,
        orgId: args.orgId ?? existingUser.orgId,
        email: args.email
      });
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      name: args.name,
      tokenIdentifier,
      avatarUrlId: args.avatarUrlId,
      orgId: args.orgId,
      email: args.email
    });
  },
});

// Mutation to update user profile
export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrlId: v.optional(v.id("_storage")),
    orgId: v.optional(v.string()),
    email:v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("No tokenIdentifier provided by Clerk");

    const user = await userByExternalId(ctx, tokenIdentifier);
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
      orgId: args.orgId ?? user.orgId,
      email: args.email
    });

    return user._id;
  },
});

// Mutation to generate upload URL for avatar
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!identity.tokenIdentifier) throw new Error("No tokenIdentifier provided by Clerk");

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
    if (!tokenIdentifier) throw new Error("No tokenIdentifier provided by Clerk");

    const user = await userByExternalId(ctx, tokenIdentifier);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      avatarUrlId: args.storageId,
    });

    return args.storageId;
  },
});


export const getUserByToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), token))
      .unique();
  },
});

export const savePreference = mutation({
  args: {
    preferredBibleVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier)) // Consistent use
      .first();

    if (!user) {
      throw new Error("User not found.");
    }

    await ctx.db.patch(user._id, {
      preferredBibleVersion: args.preferredBibleVersion,
    });
  },
});
