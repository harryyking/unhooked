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
import { Text, View, ActivityIndicator, Button } from 'react-native'; // ADDED: Button for retry
import { ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth, ClerkLoaded } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo'; // ADDED: Import NetInfo

export {
  ErrorBoundary,
} from 'expo-router';


// Access env vars correctly for all environments
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_CONVEX_URL;
const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Strict validation with early exit
if (!convexUrl || !clerkKey) {
  console.error('Missing critical env vars:', { convexUrl, clerkKey: clerkKey ? clerkKey.substring(0, 10) + '...' : null });
}

// Convex client initialization
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

// ADDED: Simple NoConnection component (customize styles as needed)
function NoConnection({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', paddingHorizontal: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No Internet Connection</Text>
      <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
        Please check your Wi-Fi or mobile data and try again.
      </Text>
      <Button title="Retry" onPress={onRetry} color="#007AFF" />
    </View>
  );
}

function Routes() {
  const { isSignedIn, isLoaded } = useAuth();
  const netInfo = useNetInfo(); // ADDED: Hook for net info
  const [isOnline, setIsOnline] = React.useState<boolean | null>(null); // ADDED: State for online status

  // ADDED: Listen for net changes (unsubscribe on unmount to avoid leaks)
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Use isInternetReachable for true internet check (falls back to isConnected if null)
      setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
    });

    // Initial fetch to set state immediately
    NetInfo.fetch().then(state => {
      setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null; 

    if (isLoaded) {
      SplashScreen.hideAsync().catch((err) => console.warn('Splash hide error:', err));
    } else {
      // Set a reasonable timeout to prevent infinite splash (increased to 10s for safety)
      timeout = setTimeout(() => {
        console.warn('Auth loading timeout—hiding splash manually');
        SplashScreen.hideAsync().catch((err) => console.warn('Splash hide error:', err));
      }, 500);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoaded]);

  // ADDED: Offline check after auth load (show loading if status undetermined)
  if (!isLoaded || isOnline === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: 'white', fontSize: 16, marginTop: 16 }}>Loading authentication...</Text>
      </View>
    );
  }

  // ADDED: Render NoConnection if offline, with retry to re-fetch net info
  if (!isOnline) {
    return <NoConnection onRetry={() => NetInfo.fetch().then(state => setIsOnline(state.isInternetReachable ?? state.isConnected ?? false))} />;
  }

  return (
    <Stack>
     <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="quizzes" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/sign-in" options={SIGN_IN_SCREEN_OPTIONS} />
          <Stack.Screen name="(auth)/sign-up" options={SIGN_UP_SCREEN_OPTIONS} />
          <Stack.Screen name="(auth)/reset-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
          <Stack.Screen name="(auth)/forgot-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
     </Stack.Protected>
        

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

  // Early critical config check with user-friendly error screen
  if (!convexUrl || !clerkKey || !convex) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
          App configuration error. Please check your setup and try again.
        </Text>
      </View>
    );
  }

  // Log for debugging (keep in prod for diagnostics, but prefix for easy filtering)
  console.log('Clerk init with key prefix:', clerkKey.substring(0, 10) + '...');

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