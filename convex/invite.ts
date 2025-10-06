// convex/invite.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { nanoid } from 'nanoid';
import type { Id } from "./_generated/dataModel";
import { getUserByClerkId, createOrUpdateUser } from "./user";  // Import plain helpers for user resolution

/**
 * Generates a unique invite code for the authenticated user.
 * Reuses an existing unused code if available; otherwise, creates a new one.
 * Non-expiring, one-time use per code.
 */
export const generateInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const clerkId = identity.subject as string;
    if (!clerkId) {
      throw new Error("No valid Clerk ID found in auth token.");
    }

    // Get or create user using plain helpers (idempotent, direct call)
    let userDoc = await getUserByClerkId(ctx, clerkId);
    if (!userDoc) {
      // Fallback: Create if not found (e.g., first-time auth without webhook)
      const newUserId = await createOrUpdateUser(ctx, {
        clerkId,
        email: identity.email ?? "",
        name: identity.name ?? "Anonymous",
      });
      // Re-fetch doc for full fields if needed (efficient single query)
      userDoc = await getUserByClerkId(ctx, clerkId);
    }
    const inviterId = userDoc?._id;  // Extract Id for schema refs

    // Check for existing unused invite from this inviter
    // Note: Full scan on inviterId (add .index('by_inviterId_usedBy', ['inviterId', 'usedBy']) to schema for O(log n))
    const existingInvite = await ctx.db
      .query("invites")
      .filter((q) => q.eq(q.field("inviterId"), inviterId))
      .filter((q) => q.eq(q.field("usedBy"), undefined))
      .first();

    if (existingInvite) {
      return { code: existingInvite.code, reused: true };
    }

    // Generate new code
    const code = nanoid(8).toUpperCase();

    await ctx.db.insert("invites", {
      inviterId: inviterId!,
      code,
      expiresAt: undefined, // Non-expiring
      usedBy: undefined,
      createdAt: Date.now(),
    });

    return { code, reused: false };
  },
});

/**
 * Redeems an invite code, linking the user to the inviter via a partnership.
 * Returns null if user not found (e.g., not yet created).
 */
export const redeemInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const clerkId = identity.subject as string;
    if (!clerkId) {
      throw new Error("No valid Clerk ID found in auth token.");
    }

    // Get or create user using plain helpers (idempotent, direct call)
    let userDoc = await getUserByClerkId(ctx, clerkId);
    if (!userDoc) {
      // Fallback: Create if not found (e.g., first-time auth without webhook)
      const newUserId = await createOrUpdateUser(ctx, {
        clerkId,
        email: identity.email ?? "",
        name: identity.name ?? "Anonymous",
      });
      // Re-fetch doc for full fields if needed (efficient single query)
      userDoc = await getUserByClerkId(ctx, clerkId);
    }
    const userId = userDoc?._id;  // Extract Id for schema refs

    // Find invite by code (O(1) via index)
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();  // Use .unique() for single result

    if (!invite) {
      throw new Error("Invalid invite code.");
    }

    if (invite.usedBy) {
      throw new Error("This invite code has already been used.");
    }

    if (invite.inviterId === userId) {
      throw new Error("You cannot use your own invite code.");
    }

    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new Error("This invite code has expired.");
    }

    // Check for existing partnership (efficient filter; consider index on user1Id_user2Id if scaling)
    const existingPartnership = await ctx.db
      .query("partnerships")
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("user1Id"), invite.inviterId), q.eq(q.field("user2Id"), userId)),
          q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), invite.inviterId))
        )
      )
      .first();

    if (existingPartnership) {
      throw new Error("A partnership with this user already exists.");
    }

    // Atomic updates: Mark invite used and create partnership
    await ctx.db.patch(invite._id, { usedBy: userId });

    const partnershipId = await ctx.db.insert("partnerships", {
      user1Id: invite.inviterId,
      user2Id: userId!,
      status: "accepted" as const,
      createdAt: Date.now(),
    });

    return { success: true, inviterId: invite.inviterId, partnershipId };
  },
});

/**
 * Gets partners (from accepted partnerships) with their current streaks.
 * Returns array of { username, currentStreak } for authenticated user.
 */
export const getPartnershipUsersWithStreaks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const clerkId = identity.subject as string;
    if (!clerkId) {
      return [];
    }

    // Get current user using plain helper (direct call)
    const currentUserDoc = await getUserByClerkId(ctx, clerkId);
    if (!currentUserDoc) {
      return [];
    }
    const currentUserId = currentUserDoc._id;  // Extract Id for filters

    // Find accepted partnerships for current user (uses indexes on user1Id/user2Id)
    const partnerships = await ctx.db
      .query("partnerships")
      .filter((q) =>
        q.or(
          q.eq(q.field("user1Id"), currentUserId),
          q.eq(q.field("user2Id"), currentUserId)
        )
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const partnerIds = partnerships
      .map((p) => (p.user1Id === currentUserId ? p.user2Id : p.user1Id))
      .filter((id): id is Id<"users"> => Boolean(id));  // Type guard

    if (partnerIds.length === 0) {
      return [];
    }

    // Fetch partner data in parallel (avoids N+1; each query uses indexes)
    const partnersData = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const profile = await ctx.db.get(partnerId);
        if (!profile) return null;

        // Get latest progress for streak (uses by_userId_logDate index; orders by logDate desc)
        const latestProgress = await ctx.db
          .query("progress")
          .withIndex("by_userId_logDate", (q) => q.eq("userId", partnerId))
          .order("desc")  // Desc on logDate (string YYYY-MM-DD works lexicographically)
          .first();

        return {
          username: profile.name ?? "New User",
          currentStreak: latestProgress?.streak ?? 0,
        };
      })
    );

    return partnersData.filter((data): data is NonNullable<typeof data> => Boolean(data));
  },
});