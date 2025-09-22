import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Logs or updates the daily progress for the authenticated user.
 * This is the core function for daily check-ins.
 */
export const logDailyCheckin = mutation({
  args: {
    logDate: v.string(),
    clean: v.boolean(),
    journal: v.optional(v.string()),
    mood: v.optional(
      v.union(
        v.literal("Joyful"),
        v.literal("Hopeful"),
        v.literal("Tempted"),
        v.literal("Struggling"),
        v.literal("Peaceful")
      )
    ),
    triggers: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const userId = identity.subject as Id<"users">;
    const { logDate, clean } = args;

    // Check for yesterday's log to calculate streak
    const yesterday = new Date(logDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const yesterdayLog = await ctx.db
      .query("progress")
      .withIndex("by_userId_logDate", (q) =>
        q.eq("userId", userId).eq("logDate", yesterdayStr)
      )
      .unique();

    // Calculate streak based on clean status and previous day
    const currentStreak = clean
      ? (yesterdayLog && yesterdayLog.clean ? yesterdayLog.streak + 1 : 1)
      : 0;

    // Check if a log for today already exists
    const existingLog = await ctx.db
      .query("progress")
      .withIndex("by_userId_logDate", (q) =>
        q.eq("userId", userId).eq("logDate", logDate)
      )
      .unique();

    if (existingLog) {
      // Update today's existing log
      await ctx.db.patch(existingLog._id, {
        ...args,
        streak: currentStreak,
        updatedAt: Date.now(),
      });
    } else {
      // Create a new log for today
      await ctx.db.insert("progress", {
        userId: userId,
        streak: currentStreak,
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true, streak: currentStreak };
  },
});

/**
 * Gets the progress log for the authenticated user for a specific date.
 */
export const getByDate = query({
  args: { logDate: v.string() }, // e.g., "2025-09-03"
  async handler(ctx, { logDate }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject as Id<"users">;

    return await ctx.db
      .query("progress")
      .withIndex("by_userId_logDate", (q) =>
        q.eq("userId", userId).eq("logDate", logDate)
      )
      .unique();
  },
});

/**
 * Gets progress logs for multiple dates (used for weekly view).
 */
export const getWeeklyLogs = query({
  args: { dates: v.array(v.string()) },
  async handler(ctx, { dates }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject as Id<"users">;

    // Get all logs for the user within the date range
    const logs = await Promise.all(
      dates.map(async (date) => {
        return await ctx.db
          .query("progress")
          .withIndex("by_userId_logDate", (q) =>
            q.eq("userId", userId).eq("logDate", date)
          )
          .unique();
      })
    );

    // Filter out null results and return only the found logs
    return logs.filter((log) => log !== null);
  },
});

/**
 * Gets the most recent progress entry to display the current streak.
 */
export const getCurrentStreak = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { streak: 0 };
    }

    const userId = identity.subject as Id<"users">;

    // Get the most recent log
    const lastLog = await ctx.db
      .query("progress")
      .withIndex("by_userId_logDate", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!lastLog) {
      return { streak: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If the last log is from today or yesterday, return its streak
    // Otherwise, the streak has been broken
    if (lastLog.logDate === today || lastLog.logDate === yesterdayStr) {
      return { streak: lastLog.streak };
    } else {
      return { streak: 0 };
    }
  },
});

/**
 * Gets recent progress history for analytics/charts.
 */
export const getRecentProgress = query({
  args: { limit: v.optional(v.number()) },
  async handler(ctx, { limit = 30 }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject as Id<"users">;

    return await ctx.db
      .query("progress")
      .withIndex("by_userId_logDate", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Gets the longest streak ever achieved by the user.
 */
export const getLongestStreak = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { longestStreak: 0 };
    }

    const userId = identity.subject as Id<"users">;

    const allLogs = await ctx.db
      .query("progress")
      .withIndex("by_userId_logDate", (q) => q.eq("userId", userId))
      .collect();

    if (allLogs.length === 0) {
      return { longestStreak: 0 };
    }

    // Find the maximum streak value
    const longestStreak = Math.max(...allLogs.map((log) => log.streak));

    return { longestStreak };
  },
});

/**
 * Gets statistics for the authenticated user.
 */
export const getStats = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalDaysLogged: 0,
        cleanDays: 0,
        cleanPercentage: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    const userId = identity.subject as Id<"users">;

    const allLogs = await ctx.db
      .query("progress")
      .withIndex("by_userId_logDate", (q) => q.eq("userId", userId))
      .collect();

    const totalDaysLogged = allLogs.length;
    const cleanDays = allLogs.filter((log) => log.clean).length;
    const cleanPercentage = totalDaysLogged > 0 ? Math.round((cleanDays / totalDaysLogged) * 100) : 0;
    const longestStreak = totalDaysLogged > 0 ? Math.max(...allLogs.map((log) => log.streak)) : 0;

    // Get current streak
    const currentStreakResult: {streak: number} = await ctx.runQuery(api.progress.getCurrentStreak)
    const currentStreak = currentStreakResult.streak;

    return {
      totalDaysLogged,
      cleanDays,
      cleanPercentage,
      currentStreak,
      longestStreak,
    };
  },
});