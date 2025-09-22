import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Gets the settings for the currently authenticated user.
 */
export const get = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject as Id<'users'>

    return await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * Updates the settings for the currently authenticated user.
 */
export const update = mutation({
  args: {
    blockerEnabled: v.optional(v.boolean()),
    notificationPrefs: v.optional(v.object({})),
    mascotPrefs: v.optional(v.object({})),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject as Id<'users'>

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
      
    if (!settings) {
        throw new Error("User settings not found.");
    }

    await ctx.db.patch(settings._id, {
        ...args,
        updatedAt: Date.now(),
    });
  },
});