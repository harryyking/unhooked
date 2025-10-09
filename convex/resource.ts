import { query } from './_generated/server';
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const listAudios = query({
  handler: async (ctx) => {
    const resources = await ctx.db.query("resources").collect();
    
    const resourcesWithUrls = await Promise.all(
      resources.map(async (resource) => {
        // Compute the URL, which can be string | null
        const url = resource.storageId 
          ? await ctx.storage.getUrl(resource.storageId) 
          : null;
        
        return {
          ...resource,
          url,
        };
      })
    );

     return resourcesWithUrls.filter(resource => resource.url !== null);
  },
});


export const addAudio = mutation({
  args: {
    storageId: v.id("_storage"), // The ID of the file you just uploaded
    title: v.string(),
  },
  handler: async (ctx, args) => {

    const newResourceId = await ctx.db.insert("resources", {
      storageId: args.storageId,
      title: args.title,  
    });

    return newResourceId;
  },
});