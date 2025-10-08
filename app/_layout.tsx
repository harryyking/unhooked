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
import { ClerkProvider, useAuth, ClerkLoaded } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

export {
  ErrorBoundary,
} from 'expo-router';

// Global error handler
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Global runtime error:', error, isFatal);
  // Prevent app abort in prod by swallowing fatal errors after logging
  if (isFatal) {
    // In RN, this doesn't stop abort, but combined with try-catch below, it layers defense
  }
});

// FIXED: Correct way to access env vars
const convexUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_CONVEX_URL;
const clerkKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Enhanced Validation
if (!convexUrl) {
  console.error('Missing EXPO_PUBLIC_CONVEX_URL in prod build');
}
if (!clerkKey) {
  console.error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in prod build');
} else if (!clerkKey.startsWith('pk_')) {
  console.error('Invalid EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY format (must start with pk_):', clerkKey.substring(0, 20) + '...');
}

// Convex client
let convex = null;
try {
  if (convexUrl) {
    convex = new ConvexReactClient(convexUrl, { unsavedChangesWarning: false });
  }
} catch (error) {
  console.error('Convex client init error:', error);
}

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
  let isSignedIn = false;
  let isLoaded = false;
  try {
    const auth = useAuth();
    isSignedIn = auth.isSignedIn;
    isLoaded = auth.isLoaded;
  } catch (error) {
    console.error('useAuth error in Routes:', error);
    // Fallback to loaded=false to show loading UI and avoid render crash
    isLoaded = false;
  }

  React.useEffect(() => {
    try {
      if (isLoaded) {
        SplashScreen.hideAsync().catch(console.error);
      } else {
        const timeout = setTimeout(() => {
          console.warn('Splash timeout—hiding manually');
          SplashScreen.hideAsync().catch(console.error);
        }, 8000);
        return () => clearTimeout(timeout);
      }
    } catch (error) {
      console.error('Splash useEffect error:', error);
      // Force hide to prevent stuck splash
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoaded]);

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
    console.error('Critical config missing—app cannot initialize', { 
      convexUrl: !!convexUrl, 
      clerkKey: clerkKey ? clerkKey.substring(0, 10) + '...' : null,
      convex: !!convex 
    });
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

  // FIXED: Wrap entire return in additional error boundary for provider crashes
  try {
    return (
      <ErrorBoundary fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <Text style={{ color: 'white', fontSize: 16 }}>Navigation error. Restart app.</Text>
        </View>
      }>
        <ClerkProvider tokenCache={tokenCache} publishableKey={clerkKey}>
          <ClerkLoaded fallback={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={{ color: 'white', fontSize: 16, marginTop: 16 }}>Auth loading...</Text>
            </View>
          }>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
              <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Routes />
                <PortalHost />
              </ThemeProvider>
            </ConvexProviderWithClerk>
          </ClerkLoaded>
        </ClerkProvider>
      </ErrorBoundary>
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