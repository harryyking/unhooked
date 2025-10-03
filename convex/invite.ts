// convex/invite.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { nanoid } from 'nanoid';

/**
 * Helper to get Convex user ID from auth identity (works in both queries and mutations).
 * Uses generic Ctx for broader compatibility.
 */
export async function getUserByTokenIdentifier(ctx: any, tokenIdentifier: string): Promise<Id<"users"> | null> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
    .first();
  return user ? user._id : null;
}

/**
 * Generates a unique invite code for the authenticated user.
 * Reuses unused codes; non-expiring, one-time use.
 */
export const generateInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const tokenIdentifier = identity.tokenIdentifier || identity.subject;
    if (!tokenIdentifier) {
      throw new Error("No valid user identifier found.");
    }

    let inviterId = await getUserByTokenIdentifier(ctx, tokenIdentifier);
    if (!inviterId) {
      // Create user if not found (e.g., first-time auth)
      inviterId = await ctx.db.insert("users", {
        tokenIdentifier,
        name: identity.name || "Anonymous",
        email: identity.email || undefined,
        avatarUrlId: undefined,
        preferredBibleVersion: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Check for existing unused invite
    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => 
          q.eq("code", inviterId),
      )
      .first();

    if (existingInvite) {
      return existingInvite.code;
    }

    // Generate new code
    const code = nanoid(8).toUpperCase();

    await ctx.db.insert("invites", {
      inviterId,
      code,
      expiresAt: undefined, // Non-expiring
      usedBy: undefined,
      createdAt: Date.now(),
    });

    return code;
  },
});

/**
 * Redeems an invite code, linking the user to the inviter via a partnership.
 */
export const redeemInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const tokenIdentifier = identity.tokenIdentifier || identity.subject;
    if (!tokenIdentifier) {
      throw new Error("No valid user identifier found.");
    }

    let userId = await getUserByTokenIdentifier(ctx, tokenIdentifier);
    if (!userId) {
      // Create user if not found
      userId = await ctx.db.insert("users", {
        tokenIdentifier,
        name: identity.name || "Anonymous",
        email: identity.email || undefined,
        avatarUrlId: undefined,
        preferredBibleVersion: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Find invite by code (using index for efficiency)
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();

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

    // Check for existing partnership
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

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      usedBy: userId,
    });

    // Create partnership
    await ctx.db.insert("partnerships", {
      user1Id: invite.inviterId,
      user2Id: userId,
      status: "accepted" as const,
      createdAt: Date.now(),
    });

    return { success: true, inviterId: invite.inviterId };
  },
});

/**
 * Gets partners (from redeemed invites) with their current streaks.
 */
export const getPartnershipUsersWithStreaks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const tokenIdentifier = identity.tokenIdentifier || identity.subject;
    if (!tokenIdentifier) {
      return [];
    }

    const currentUserId = await getUserByTokenIdentifier(ctx, tokenIdentifier);
    if (!currentUserId) {
      return [];
    }

    // Find partnerships for current user
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

    const partnerIds = partnerships.map(p =>
      p.user1Id === currentUserId ? p.user2Id : p.user1Id
    );

    if (partnerIds.length === 0) {
      return [];
    }

    // Fetch partner data in parallel
    const partnersData = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const profile = await ctx.db.get(partnerId);
        if (!profile) return null;

        // Get latest progress for streak
        const latestProgress = await ctx.db
          .query("progress")
          .withIndex("by_userId_logDate", (q) => q.eq("userId", partnerId))
          .order("desc")
          .first();

        return {
          username: profile.name || "New User",
          currentStreak: latestProgress?.streak ?? 0,
        };
      })
    );

    return partnersData.filter(Boolean); // Filter out nulls
  },
});