// convex/clerk.ts - Clerk Webhook Handler with HTTP Router
import { httpAction } from "./_generated/server";
import { verifyWebhook } from "@clerk/backend/webhooks";  // Official verification (install: npm i @clerk/backend)
import { api } from "./_generated/api";  // For type-safe calls to internal mutations
import { httpRouter } from "convex/server";

// Main HTTP router for Clerk webhooks
export const clerk = httpRouter();

// Define the webhook route: POST /clerk
clerk.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Verify webhook payload (auto-handles body parsing and Svix signature)
      const evt = await verifyWebhook(request,{ signingSecret: process.env.CLERK_WEBHOOK_SECRET!});

      console.log(`[Clerk Webhook] Received event: ${evt.type} for user ${evt.data.id}`);  // Debug logging

      // Handle event types
      switch (evt.type) {
        case "user.created": {
          const { id, email_addresses, first_name, last_name, external_accounts } = evt.data;
          const email = email_addresses[0]?.email_address ?? "";


           let fullName = `${first_name ?? ""} ${last_name ?? ""}`.trim();
          if (!fullName && external_accounts && external_accounts.length > 0) {
            const providerAccount = external_accounts[0];  // Assume first account (e.g., Google/Apple)
            fullName = `${providerAccount.first_name ?? ""} ${providerAccount.last_name ?? ""}`.trim();
          }

          // Call internal mutation (handles create/update idempotently)
          await ctx.runMutation(api.user.createOrUpdate, {
              clerkId:id,
              email: email,
              name: fullName,
          });

          console.log(`[Clerk Webhook] Processed ${evt.type}: ${id} (${email})`);
          break;
        }
        case "user.deleted": {
          const { id } = evt.data;
          await ctx.runMutation(api.user.deleteUser, { clerkId: id! });
          console.log(`[Clerk Webhook] Processed user.deleted: ${id}`);
          break;
        }
        default: {
          console.log(`[Clerk Webhook] Ignored event: ${evt.type}`);
        }
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error(`[Clerk Webhook] Error processing event:`, err);  // Detailed logging for Convex dashboard
      return new Response(`Webhook failed: ${err}`, { status: 400 });
    }
  }),
});


export default clerk