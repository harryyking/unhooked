// convex/users.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";  // For plain helper types
import { Doc, Id } from "./_generated/dataModel";  // For type safety

// --------------------- PLAIN HELPERS (for direct reuse, no runQuery needed) ---------------------
/**
 * Plain helper: Get user by Clerk ID (O(1) via index). Returns null if not found.
 * Usable in queries/mutations/actions (ctx type is compatible).
 */
export async function getUserByClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

/**
 * Plain helper: Idempotent upsert user from Clerk data.
 * Returns the user _id; handles partial updates efficiently.
 * Usable in mutations/actions (pass MutationCtx).
 */
export async function createOrUpdateUser(
  ctx: MutationCtx,
  { clerkId, email, name }: { clerkId: string; email?: string; name?: string }
): Promise<Id<"users">> {
  const existingUser = await getUserByClerkId(ctx, clerkId);

  const now = Date.now();
  const updates = {
    email: email ?? existingUser?.email,
    name: name ?? existingUser?.name ?? "",
    updatedAt: now,
  };

  if (existingUser) {
    // Patch only changed fields (efficient; schema validation runs)
    await ctx.db.patch(existingUser._id, updates);
    return existingUser._id;
  } else {
    // Insert new with full data
    const newUserId = await ctx.db.insert("users", {
      clerkId,
      ...updates,
      createdAt: now,
    });
    return newUserId;
  }
}

// --------------------- PUBLIC FUNCTIONS (use helpers directly) ---------------------
/**
 * Public: Get current user (auth-guarded, for client-side profile).
 */
export const get = query({
  args: {},  // No args; uses auth context
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Unauthenticated");
    }
    const clerkId = identity.subject as string;
    return await getUserByClerkId(ctx, clerkId);  // Direct call to plain helper
  },
});

/**
 * Public: Idempotent create/update user from Clerk data (e.g., webhook or login).
 */
export const createOrUpdate = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),  // Matches schema
    name: v.optional(v.string()),   // Matches schema
  },
  handler: async (ctx, args) => {
    return await createOrUpdateUser(ctx, args);  // Direct call to plain helper
  },
});

export const deleteUser = mutation({
  args: {
    clerkId: v.string(),  // Clerk user ID to delete
  },
  handler: async (ctx, { clerkId }) => {
    // Optional: Auth check (e.g., only allow if caller is admin or the user themselves)
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject !== clerkId) {
      throw new Error("Unauthorized: Can only delete own account");
    }

    // Resolve user by Clerk ID
    const userDoc = await getUserByClerkId(ctx, clerkId);
    if (!userDoc) {
      throw new Error(`User not found: ${clerkId}`);
    }

    // Delete the document
    const deletedId = await ctx.db.delete(userDoc._id);
    
    console.log(`[Users] Deleted user: ${clerkId} (ID: ${deletedId})`);  // Optional logging

    return { success: true, deletedId };
  },
});