import { query } from './_generated/server';
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const listAudios = query({
  handler: async (ctx) => {
    const resources = await ctx.db.query("resources").collect();
    return await Promise.all(
      resources.map(async (resource) => ({
        ...resource,
        url: await ctx.storage.getUrl(resource.storageId),  // Returns string | null
      }))
    );
  },
});


export const addAudio = mutation({
  args: {
    storageId: v.id("_storage"), // The ID of the file you just uploaded
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    url:v.optional(v.string()),
  },
  handler: async (ctx, args) => {

    const newResourceId = await ctx.db.insert("resources", {
      storageId: args.storageId,
      title: args.title,  
    });

    return newResourceId;
  },
});