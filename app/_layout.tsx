import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, ErrorBoundary } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { useColorScheme } from 'nativewind';
import Constants from 'expo-constants';
import * as React from 'react';
import { ErrorUtils } from 'react-native';
import { Text, View, ActivityIndicator } from 'react-native';
import { ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth, ClerkLoaded } from '@clerk/clerk-expo'; // FIXED: Re-add ClerkLoaded import
import { ConvexProviderWithClerk } from 'convex/react-clerk';

export {
  ErrorBoundary,
} from 'expo-router';

// Global error handler
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Global runtime error:', error, isFatal);
});

// FIXED: Correct way to access env vars
const convexUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_CONVEX_URL;
const clerkKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Validation
if (!convexUrl) {
  console.error('Missing EXPO_PUBLIC_CONVEX_URL in prod build');
}
if (!clerkKey) {
  console.error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in prod build');
}

// Convex client
const convex = convexUrl 
  ? new ConvexReactClient(convexUrl, { unsavedChangesWarning: false })
  : null;

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
      SplashScreen.hideAsync().catch(console.error); // FIXED: Add catch for safety
    } else {
      // FIXED: Restore timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('Splash timeout—hiding manually');
        SplashScreen.hideAsync().catch(console.error);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [isLoaded]);

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: 'white', fontSize: 16, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack>
      {!isSignedIn ? (
        <>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="quizzes" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/sign-in" options={SIGN_IN_SCREEN_OPTIONS} />
          <Stack.Screen name="(auth)/sign-up" options={SIGN_UP_SCREEN_OPTIONS} />
          <Stack.Screen name="(auth)/reset-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
          <Stack.Screen name="(auth)/forgot-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
        </>
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
          <Stack.Screen name="prayer-session" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  // Early fallback if critical config missing
  if (!convexUrl || !clerkKey || !convex) {
    console.error('Critical config missing—app cannot initialize', { convexUrl, clerkKey: clerkKey ? clerkKey.substring(0, 10) + '...' : null });
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
          App configuration error. Please contact support.
        </Text>
      </View>
    );
  }

  // FIXED: Add logging for key validation
  console.log('Using Clerk key prefix:', clerkKey.substring(0, 10) + '...');

  try {
    return (
      <ClerkProvider tokenCache={tokenCache} publishableKey={clerkKey}>
        <ClerkLoaded> {/* FIXED: Re-add to gate useAuth until loaded */}
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
  } catch (error) {
    console.error('RootLayout provider init error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Initialization failed. Check logs.</Text>
      </View>
    );
  }
}