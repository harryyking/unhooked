import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import Constants from 'expo-constants';
import { ConvexClientProvider } from '@/components/convexclientProvider'; // Adjust path if needed

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';


const getClerkPublishableKey = (): string => {
  const envKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const configKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  
  const publishableKey = envKey || configKey;
  
  if (!publishableKey) {
    throw new Error(
      'Clerk publishable key not found. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file or add clerkPublishableKey to app.json extra field'
    );
  }
  
  return publishableKey;
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ClerkProvider 
      publishableKey={getClerkPublishableKey()}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
      <ConvexClientProvider>
        <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Routes />
          <PortalHost />
        </ThemeProvider>
      </ConvexClientProvider>
      </ClerkLoaded>
    </ClerkProvider>

  );
}

SplashScreen.preventAutoHideAsync();

function Routes() {
  const { isSignedIn, isLoaded } = useAuth();

  React.useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack>
      {/* Screens only shown when the user is NOT signed in */}

     


      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="quizzes" options={{headerShown: false}} />
        <Stack.Screen name="onboarding" options={{headerShown: false}} />
        <Stack.Screen name="(auth)/sign-up" options={SIGN_UP_SCREEN_OPTIONS} />
      </Stack.Protected>

      {/* Screens only shown when the user IS signed in */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{headerShown:false}} />
      </Stack.Protected>

      {/* Screens outside the guards are accessible to everyone (e.g. not found) */}
    </Stack>
  );
}

const SIGN_IN_SCREEN_OPTIONS = {
  headerShown: false,
  title: 'Sign in',
};

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
};