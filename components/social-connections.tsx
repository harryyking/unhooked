import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import { Alert, Image, Platform, View, type ImageSourcePropType } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useClerk, useSSO } from '@clerk/clerk-expo';
import * as Crypto from 'expo-crypto'
// Call this at the module level to handle pending auth sessions
WebBrowser.maybeCompleteAuthSession();

// IMPORTANT: Ensure your app's scheme (e.g., 'unhooked') is defined in app.json under "expo.scheme".
// In Clerk Dashboard > API Keys > Authorized redirect URIs, add the exact URI your app generates, e.g., 'unhooked://auth' (without trailing slash).
// If Clerk only accepts with '/auth', use path: 'auth' in makeRedirectUri to match.
// For one-click sign-in: In Clerk Dashboard > User & Authentication > Sign-up, make all fields optional or enable progressive sign-up.
// Disable any MFA under Multi-factor. This ensures no pending steps after OAuth.
// For native Apple: Install expo-apple-authentication, add to app.json plugins, and enable entitlements in EAS build.
// Convex URL: Set EXPO_PUBLIC_CONVEX_URL in your env for the /apple-signin endpoint.

const APP_SCHEME = 'unhooked';
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL; // e.g., 'https://your-app.convex.cloud'

type SocialConnectionStrategy = 'oauth_google' | 'oauth_github' | 'oauth_apple';

const SOCIAL_CONNECTION_STRATEGIES: {
  type: SocialConnectionStrategy;
  source: ImageSourcePropType;
  label: string;
  useTint?: boolean;
}[] = [
  {
    type: 'oauth_apple',
    source: { uri: 'https://img.clerk.com/static/apple.png?width=160' },
    label: 'Apple',
    useTint: true,
  },
  {
    type: 'oauth_google',
    source: { uri: 'https://img.clerk.com/static/google.png?width=160' },
    label: 'Google',
    useTint: false,
  },
];

export function SocialConnections() {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();
  const { startSSOFlow } = useSSO(); // Destructure setActive for native flow
  const { setActive: clerkSetActive, loaded } = useClerk();

  const onSocialLoginPress = (strategy: SocialConnectionStrategy) => async () => {
    if (!loaded) {
      return;
    }
    try {
      // Native Apple flow for iOS (iPhone/iPad) - seamless, compliant UX
      if (strategy === 'oauth_apple' && Platform.OS === 'ios') {

        const { default: AppleAuthentication } = await import('expo-apple-authentication');

        const nonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Math.random().toString(36) + Date.now().toString()
        );  

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce
        });

        if (!credential) {
          return; // User canceled
        }

        // Send native credential to Convex backend for verification and session creation
        const response = await fetch(`${CONVEX_URL}/api/apple-signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identityToken: credential.identityToken,
            fullName: credential.fullName, // { givenName, familyName } - only on first sign-in
            email: credential.email,
            nonce
          }),
          
        });

        if (!response.ok) {
          throw new Error('Backend authentication failed');
        }

        const { createdSessionId } = await response.json();

        if (createdSessionId) {
          await clerkSetActive({ session: createdSessionId });
          // Let protected routes handle navigation
          return;
        }

        throw new Error('No session created');
      }

      // Web/OAuth fallback for non-iOS (Android/Web) or other strategies
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: APP_SCHEME,
        path: 'auth', // Included as per config—Clerk requires/accepts this path
      });


      const { createdSessionId, signIn, signUp, setActive } = await startSSOFlow({
        strategy,
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return;
      }

      // Handle pending state silently (unlikely with one-click config; no user alert)
      if (signIn || signUp) {
        // Optionally redirect to continue screen
        // router.push('/continue-sign-up');
        return;
      }

      // Fallback for unexpected issues
      throw new Error('Unexpected authentication state');

    } catch (err) {
      // Graceful error handling: User-friendly message, internal logging only in dev
      const isCanceled = err instanceof Error && (err.message === 'ERR_CANCELED' || err.message.includes('canceled'));
      if (isCanceled) {
        // User dismissed prompt - no action needed
        return;
      }

      const errorDetails = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (__DEV__) {
        console.error('SSO Error:', errorDetails, err);
      }
      // Generic, non-technical alert
      Alert.alert(
        'Sign In Issue',
        'Could not complete sign-in. Please try again or use another method.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View className="gap-2 flex-col">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => (
        // Conditionally render Apple only on iOS for native button; fallback for others
        (strategy.type !== 'oauth_apple' || Platform.OS === 'ios') ? (
          <View key={strategy.type} className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-4 items-center"
              onPress={onSocialLoginPress(strategy.type)}
              accessibilityLabel={`Continue with ${strategy.label}`} // Accessibility best practice
            >
              <Image
                className={cn('size-4', strategy.useTint && Platform.select({ web: 'dark:invert' }))}
                tintColor={Platform.select({
                  native: strategy.useTint ? (colorScheme === 'dark' ? 'white' : 'black') : undefined,
                })}
                source={strategy.source}
                accessibilityIgnoresInvertColors={true} // Prevents color inversion issues
              />
              <Text className="text-foreground">Continue with {strategy.label}</Text>
            </Button>
          </View>
        ) : null
      ))}
    </View>
  );
}

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      void WebBrowser.warmUpAsync();
      return () => void WebBrowser.coolDownAsync();
    }
  }, []);
};