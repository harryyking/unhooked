import { useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import Constants from 'expo-constants';
import { PropsWithChildren, useCallback } from 'react';

// Try environment variables first, fallback to expo config
const getConvexUrl = (): string => {
  // For development and production builds
  const envUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  
  // Fallback to expo config (for managed workflow compatibility)
  const configUrl = Constants.expoConfig?.extra?.convexUrl;
  
  const convexUrl = envUrl || configUrl;
  
  if (!convexUrl) {
    throw new Error(
      'Convex URL not found. Please set EXPO_PUBLIC_CONVEX_URL in your .env file or add convexUrl to app.json extra field'
    );
  }
  
  return convexUrl;
};

const convex = new ConvexReactClient(getConvexUrl(), {
  unsavedChangesWarning: false,
  // Add verbose logging in development
  verbose: __DEV__,
});

export function ConvexClientProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn } = useAuth();  // Extract for checks/logs

  console.log("Clerk auth loaded?", isLoaded);
  console.log("Clerk auth signed in?", isSignedIn);

  if (!isLoaded) {
    console.log("Clerk auth not loaded, returning null from provider.");
    return null;  // or your loading component
  }

  console.log("Rendering ConvexProviderWithClerk.");
  
  return (
    <ConvexProviderWithClerk 
      client={convex} 
      useAuth={useAuth}
    >
      {children}
    </ConvexProviderWithClerk>
  );
}