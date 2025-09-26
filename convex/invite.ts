import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { nanoid } from 'nanoid';

// Helper to get Convex user ID from tokenIdentifier (Clerk ID)
export async function getUserByTokenIdentifier(ctx: QueryCtx, tokenIdentifier: string): Promise<Id<"users"> | null> {
  const user = await ctx.db
    .query('users')
    .filter((q) => q.eq(q.field("tokenIdentifier"), tokenIdentifier))
    .first();
  return user ? user._id : null;
}

/**
 * Generates a unique invite code for the authenticated user.
 * The code is simple, non-expiring, and can be used once.
 */
export const generateInvite = mutation({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }
    let inviterId = await getUserByTokenIdentifier(ctx, identity.subject);
    if (!inviterId) {
      // Create the user if not found
      inviterId = await ctx.db.insert("users", {
        tokenIdentifier: identity.subject,
        name: identity.name || "Anonymous",
        avatarUrlId: undefined,
        orgId: undefined,
      });
    }

    // Check for an existing, unused invite code for the current user.
    const existingInvite = await ctx.db
      .query("invites")
      .filter((q) =>
        q.and(
          q.eq(q.field("inviterId"), inviterId),
          q.eq(q.field("usedBy"), undefined)
        )
      )
      .first();

    // If a valid, unused invite already exists, return it.
    if (existingInvite) {
      return existingInvite.code;
    }

    // If no existing invite is found, generate a new, cryptographically secure code.
    const code = nanoid(8).toUpperCase();

    await ctx.db.insert("invites", {
      inviterId,
      code,
      createdAt: Date.now(),
    });

    return code;
  },
});

/**
 * Allows a new user to redeem an invite code.
 * This links the new user to the inviter.
 */
export const redeemInvite = mutation({
  args: { code: v.string() },
  async handler(ctx, { code }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }
    let userId = await getUserByTokenIdentifier(ctx, identity.subject);
    if (!userId) {
      // Create the user if not found
      userId = await ctx.db.insert("users", {
        tokenIdentifier: identity.subject,
        name: identity.name || "Anonymous",
        avatarUrlId: undefined,
        orgId: undefined,
      });
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    // --- Validation Checks ---
    if (!invite) {
      throw new Error("Invalid invite code.");
    }
    if (invite.usedBy) {
      throw new Error("This invite code has already been used.");
    }
    if (invite.inviterId === userId) {
      throw new Error("You cannot use your own invite code.");
    }

    // Check for existing partnership to prevent duplicates
    const existingPartnership = await ctx.db
      .query("partnerships")
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("user1Id"), invite.inviterId), q.eq(q.field("user2Id"), userId)),
          q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), invite.inviterId))
        )
      )
      .unique();

    if (existingPartnership) {
      throw new Error("A partnership with this user already exists.");
    }

    // Mark the invite as used by the current user
    await ctx.db.patch(invite._id, {
      usedBy: userId,
    });

    // Create a new partnership record
    await ctx.db.insert("partnerships", {
      user1Id: invite.inviterId,
      user2Id: userId,
      status: "accepted",
      createdAt: Date.now(),
    });

    return { success: true, inviterId: invite.inviterId };
  },
});

/**
 * Gets a list of users who have joined using the current user's invites,
 * along with their current streak.
 */
export const getPartnershipUsersWithStreaks = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const currentUserId = await getUserByTokenIdentifier(ctx, identity.subject);
    if (!currentUserId) {
      return [];
    }

    // Find all partnerships involving the current user
    const partnerships = await ctx.db
      .query("partnerships")
      .filter((q) =>
        q.or(
          q.eq(q.field("user1Id"), currentUserId),
          q.eq(q.field("user2Id"), currentUserId)
        )
      )
      .collect();

    // Find the partner ID for each partnership
    const partnerIds = partnerships.map(p =>
      p.user1Id === currentUserId ? p.user2Id : p.user1Id
    );

    if (partnerIds.length === 0) {
      return [];
    }

    // For each partner, fetch their profile and latest progress
    const partnersData = await Promise.all(
      partnerIds.map(async (partnerId) => {
        // Get the invited user's profile to display their username
        const profile = await ctx.db.get(partnerId); // Use get() for _id lookup

        // Get the most recent progress entry for that user to find their streak
        const latestProgress = await ctx.db
          .query("progress")
          .withIndex("by_userId_logDate", (q) => q.eq("userId", partnerId))
          .order("desc")
          .first();

        return {
          username: profile?.name ?? "New User",
          currentStreak: latestProgress?.streak ?? 0,
        };
      })
    );

    return partnersData;
  },
});