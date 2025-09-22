import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getUserByTokenIdentifier } from "./invite";

/**
 * Creates a new story in the database.
 */
export const createStory = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.union(v.literal("Passion Story"), v.literal("Testimony")),
    readTime: v.string(),
  },
  async handler(ctx, { title, content, category, readTime }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User profile not found.");
  }

    const userId = user._id;  
    const author = user.name || "Anonymous";

    const storyId = await ctx.db.insert("stories", {
      userId,
      author,
      title,
      content,
      category,
      readTime,
      upvotes: 0,
      comments: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return storyId;
  },
});

/**
 * Fetches stories from the database based on the provided filter.
 */
export const getStories = query({
  args: {
    filterType: v.optional(v.union(v.literal("trending"), v.literal("recent"), v.literal("top"))),
  },
  async handler(ctx, { filterType }) {
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject as Id<'users'>;

    // Define the query based on the filter type.
    let storiesQuery;

   // Add better sorting logic
   if (filterType === "recent") {
    storiesQuery = ctx.db.query("stories").order("desc");
  } else if (filterType === "top") {
    // For "top", you might want to consider both upvotes AND recency
    storiesQuery = ctx.db.query("stories").order("desc");
  } else { // trending - could be more complex algorithm
    storiesQuery = ctx.db.query("stories").order("desc");
  }

  const stories = await storiesQuery.collect();

    // Check if the current user has upvoted each story.
    const storiesWithUpvotes = await Promise.all(
      stories.map(async (story) => {
        const hasUpvoted = currentUserId
          ? await ctx.db
              .query("upvotes")
              .withIndex("by_userId_storyId", (q) =>
                q.eq("userId", currentUserId).eq("storyId", story._id)
              )
              .first() !== null
          : false;

        return { ...story, hasUpvoted };
      })
    );

    return storiesWithUpvotes;
  },
});

/**
 * Handles the upvote/un-upvote logic for a story.
 */
export const upvoteStory = mutation({
  args: { storyId: v.id("stories") },
  async handler(ctx, { storyId }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User profile not found.");
  }

  const userId = user._id

    // Check if the user has already upvoted this story.
    const existingUpvote = await ctx.db
      .query("upvotes")
      .withIndex("by_userId_storyId", (q) =>
        q.eq("userId", userId).eq("storyId", storyId)
      )
      .first();

    const story = await ctx.db.get(storyId);
    if (!story) {
      throw new Error("Story not found.");
    }

    if (existingUpvote) {
      // User has already upvoted, so we remove the upvote.
      await ctx.db.delete(existingUpvote._id);
      await ctx.db.patch(storyId, { upvotes: story.upvotes - 1 });
    } else {
      // User has not upvoted, so we add the upvote.
      await ctx.db.insert("upvotes", { userId, storyId });
      await ctx.db.patch(storyId, { upvotes: story.upvotes + 1 });
    }
  },
});
