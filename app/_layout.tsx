import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, ErrorBoundary } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { useColorScheme } from 'nativewind';
import * as Constants from 'expo-constants'; // For safe env access
import * as React from 'react';
import { ErrorUtils } from 'react-native'; // Global error handler
import { Text, View } from 'react-native'; // For fallback UI
import { ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth, ClerkLoaded } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Global error handler for silent prod crashes
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Global runtime error:', error, isFatal);
  // In prod, this logs to console (visible in Xcode Console on device)
});

// Safe env access (bundled in prod via eas.json)
const convexUrl = Constants.default.expoConfig?.extra?.EXPO_PUBLIC_CONVEX_URL;
const clerkKey = Constants.default.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Early validation for prod (logs and falls back if missing)
if (!convexUrl) {
  console.error('Missing EXPO_PUBLIC_CONVEX_URL in prod build');
}
if (!clerkKey) {
  console.error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in prod build');
}

// Convex client (null if URL missing, to prevent init crash)
const convex = convexUrl 
  ? new ConvexReactClient(convexUrl, { unsavedChangesWarning: false })
  : null;

// Screen options (unchanged)
const SIGN_IN_SCREEN_OPTIONS = {
  headerShown: false,
  title: 'Sign in',
} as const;

const SIGN_UP_SCREEN_OPTIONS = {
  presentation: 'modal',
  title: '',
  headerTransparent: true,
  gestureEnabled: false,
} as const;

const DEFAULT_AUTH_SCREEN_OPTIONS = {
  title: '',
  headerShadowVisible: false,
  headerTransparent: true,
} as const;

function Routes() {
  const { isSignedIn, isLoaded } = useAuth();

  React.useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
    } else {
      // Fallback: Hide splash after 5s to prevent infinite loading/blank screen
      const timeout = setTimeout(() => {
        console.warn('Splash timeout—hiding manually');
        SplashScreen.hideAsync();
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading...</Text>
      </View>
    ); // Fallback to avoid blank during auth load
  }

  return (
    <Stack>
      {/* Screens only shown when the user is NOT signed in */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="quizzes" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/sign-in" options={SIGN_IN_SCREEN_OPTIONS} />
        <Stack.Screen name="(auth)/sign-up" options={SIGN_UP_SCREEN_OPTIONS} />
        <Stack.Screen name="(auth)/reset-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
        <Stack.Screen name="(auth)/forgot-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
      </Stack.Protected>

      {/* Protected authenticated screens */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
        <Stack.Screen name="prayer-session" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  // Early fallback if critical env missing (prevents blank screen)
  if (!convexUrl || !clerkKey || !convex) {
    console.error('Critical config missing—app cannot initialize');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>App config error. Rebuild with env vars.</Text>
      </View>
    );
  }

  return (
      <ClerkProvider tokenCache={tokenCache} publishableKey={clerkKey}>
        <ClerkLoaded>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              <Routes />
              <PortalHost />
            </ThemeProvider>
          </ConvexProviderWithClerk>
        </ClerkLoaded>
      </ClerkProvider>
  );
}