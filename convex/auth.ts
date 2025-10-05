import { AuthFunctions, createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { expo } from '@better-auth/expo';
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query, httpAction } from "./_generated/server";  // Add httpAction import

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        console.log('onCreate triggered for new user:', authUser._id, authUser.email);  // Changed to .id
        await ctx.db.insert("users", {
          name: authUser.name,
          email: authUser.email,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tokenIdentifier: authUser._id  // Changed to .id
        });
      },
      onUpdate: async (ctx, oldUser, newUser) => {
        console.log('onUpdate triggered for existing user:', newUser._id, 'Changes:', { oldName: oldUser.name, newName: newUser.name });  // Changed to .id
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", newUser._id))  // Changed to .id
          .first();
        if (existingUser) {
          await ctx.db.patch(existingUser._id, {  // Keep _id for Convex patch
            name: newUser.name ?? existingUser.name,
            email: newUser.email ?? existingUser.email,
            updatedAt: Date.now(),
          });
        }
      },
      onDelete: async (ctx, authUser) => {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", authUser._id))  // Changed to .id
          .first();
        if (existingUser) await ctx.db.delete(existingUser._id);
      },
    },
  },
});

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  // Add logging for debugging (remove in prod)
  if (!optionsOnly) {
    console.log('createAuth called with optionsOnly=false; processing request');
  }

  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    trustedOrigins: ["unhooked://", "unhooked://auth", "https://appleid.apple.com", "https://accounts.google.com", "https://insightful-vulture-707.convex.site"],
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID as string, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        redirectURI: `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/api/auth/callback/google`
      },
      apple: { 
        clientId: process.env.APPLE_CLIENT_ID as string,  // Service ID
        clientSecret: process.env.APPLE_CLIENT_SECRET as string,  // JWT
        appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER as string,  // Bundle ID for aud claim
      }, 
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      stateExpiresIn: 60 * 10,
    },
    baseURL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL!,
    plugins: [
      expo(),
      convex(),
    ],
  });
};

export const GET = httpAction(async (ctx, request) => {
  console.log('Auth GET handler hit');  // Debug log
  const auth = createAuth(ctx);
  return auth.handler(request);
});

export const POST = httpAction(async (ctx, request) => {
  console.log('Auth POST handler hit (e.g., sign-in)');  // Debug log
  const auth = createAuth(ctx);
  return auth.handler(request);
});

export const PUT = httpAction(async (ctx, request) => createAuth(ctx).handler(request));
export const DELETE = httpAction(async (ctx, request) => createAuth(ctx).handler(request));
export const PATCH = httpAction(async (ctx, request) => createAuth(ctx).handler(request));

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});