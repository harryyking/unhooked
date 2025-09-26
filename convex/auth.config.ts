// convex/auth.config.ts
export default {
    providers: [
      {
        domain: "https://clerk.unhooked.xyz", // Your Clerk issuer domain
        applicationID: "convex", // Name of your JWT template (or "convex" if custom)
      },
    ],
  };