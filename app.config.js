export default ({ config }) => {
    return {
      ...config,
      extra: {
        ...config.extra,
        EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL || config.extra.EXPO_PUBLIC_CONVEX_URL,
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || config.extra.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      },
    };
  };