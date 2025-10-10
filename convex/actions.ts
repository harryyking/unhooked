"use node"

import { action } from "./_generated/server";
import { ClerkClient, createClerkClient } from "@clerk/backend";
import { v } from "convex/values";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export const appleSignIn = action({
  args: {
    identityToken: v.string(),
    fullName: v.object({
        givenName: v.optional(v.string()),
        familyName: v.optional(v.string())
    }),
    email: v.string(), // Optional
    nonce: v.string(), // Optional
  },
  handler: async (ctx, args) => {
    const { identityToken, fullName, email, nonce } = args;

    if (!identityToken) {
      throw new Error("Missing identityToken");
    }

    try {
      // Verify Apple ID token using Apple's public keys
      const client = jwksClient({ jwksUri: "https://appleid.apple.com/auth/keys" });

      const header = jwt.decode(identityToken, { complete: true })?.header;
      if (!header || !header.kid) {
        throw new Error("Invalid token header");
      }
      const key = await client.getSigningKey(header.kid);
      const publicKey = key.getPublicKey();

      const decoded = jwt.verify(identityToken, publicKey, {
        algorithms: ["RS256"],
        issuer: "https://appleid.apple.com",
        audience: process.env.APPLE_CLIENT_ID,  // Your Services ID from Apple Developer
        ...(nonce && { nonce }),  // Validate nonce if provided
      }) as any;  // Type as any for decoded claims

      const sub = decoded.sub;  // Apple's unique user ID
      const appleEmail = email || decoded.email;  // Prioritize provided email if available
      const firstName = fullName?.givenName ?? decoded.given_name ?? '';
      const lastName = fullName?.familyName ?? decoded.family_name ?? '';

      // Initialize Clerk backend client
      const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

      // Search by email (reliable for consistency across native/OAuth)
      const existingUsers = await clerkClient.users.getUserList({ emailAddress: [appleEmail] });
      let userId: string;

      if (existingUsers.data.length > 0) {
        userId = existingUsers.data[0].id;
        // Update name if provided (Apple only sends fullName on first sign-in)
        if (firstName || lastName) {
          await clerkClient.users.updateUser(userId, {
            firstName: firstName || existingUsers.data[0].firstName,
            lastName: lastName || existingUsers.data[0].lastName,
          });
        }
        // Optional: Store apple_sub in privateMetadata for extra verification/logging
        await clerkClient.users.updateUser(userId, {
          privateMetadata: { ...existingUsers.data[0].privateMetadata, apple_sub: sub },
        });
      } else {
        // Create new user
        const newUser = await clerkClient.users.createUser({
          emailAddress: [appleEmail],
          firstName,
          lastName,
          privateMetadata: { apple_sub: sub },  // Optional: Track for future native sign-ins
        });
        userId = newUser.id;
      }

      // Create session for the user (triggers user.created webhook for your Convex sync)
      const session = await clerkClient.sessions.createSession({ userId });
      const createdSessionId = session.id;

      return { createdSessionId };
    } catch (err) {
      if (err instanceof Error) {
        console.error(`[Apple SignIn] Error:`, err.message);
        throw new Error(`Apple sign-in failed: ${err.message}`); // Re-throw for handler to catch
      }
      throw new Error("Apple sign-in failed");
    }
  },
});