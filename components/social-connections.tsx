import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, Image, Platform, View, type ImageSourcePropType } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { authClient } from '@/lib/auth-client';
import { debugSessionStorage } from '@/lib/secure';
import * as crypto from 'expo-crypto';  // Add for nonce

const SOCIAL_CONNECTION_STRATEGIES: {
  type: 'google' | 'apple';
  source: ImageSourcePropType;
  useTint?: boolean;
  label: string;
}[] = [
  {
    type: 'apple',
    source: { uri: 'https://img.clerk.com/static/apple.png?width=160' },
    label: 'Sign in with Apple',
    useTint: true,
  },
  {
    type: 'google',
    source: { uri: 'https://img.clerk.com/static/google.png?width=160' },
    label: 'Sign in with Google',
    useTint: false,
  },
];

export function SocialConnections() {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();

  const handleAppleSignIn = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Apple Sign In', 'Only available on iOS');
        return;
      }

      // Generate nonce for security
      const rawState = Math.random().toString(36).substring(7);
      const nonce = await crypto.digestStringAsync(
        crypto.CryptoDigestAlgorithm.SHA256,
        rawState
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce,  // Pass nonce
        state: rawState,  // Also pass state for CSRF
      });

      console.log('Native credential:', credential);

      const { identityToken } = credential;
      if (!identityToken) {
        throw new Error('No identity token returned');
      }

      console.log('Sending token to Better Auth (length):', identityToken.length);

      // Pass token to Better Auth (headless, no redirect)
      const result = await authClient.signIn.social({
        provider: 'apple',
        idToken: { token: identityToken, nonce },  // Include nonce
        callbackURL: '/(tabs)/home',  // For post-auth navigation
      });

      console.log('Better Auth result:', JSON.stringify(result, null, 2));  // Enhanced debug

      await debugSessionStorage();  // Debug log

      // Refetch session to confirm
      const session = await authClient.getSession();
      console.log('Session after Apple sign-in:', session ? 'Valid' : 'None');

      if (result.error || !session) {
        console.error('Apple sign-in error:', result.error);
        Alert.alert('Apple Sign In Failed', result.error?.message || 'No session created—check server logs');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      console.error('Apple sign-in failed:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err.code === 'ERR_CANCELED') errorMessage = 'Sign in was canceled';
      else if (err.message?.includes('not completed')) errorMessage = 'Sign up could not be completed.';
      else if (err.message?.includes('redirect_uri_mismatch')) errorMessage = 'Redirect config error—check scheme.';
      else if (err.message?.includes('invalid_client')) errorMessage = 'Client credentials invalid—check env vars.';
      Alert.alert('Apple Sign In Error', errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'unhooked',
        path: 'auth',
      });

      // Google redirect flow
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectUrl,  // Use redirectUrl here too
      });

      console.log('Initial Google result:', JSON.stringify(result, null, 2));  // Debug

      // Handle auth URL if returned
      if (result.data?.url) {
        const authResult = await WebBrowser.openAuthSessionAsync(result.data.url, redirectUrl);
        if (authResult.type !== 'success') {
          throw new Error(`Auth session failed: ${authResult.type}`);
        }

        // Refetch session after successful redirect
        const session = await authClient.getSession();
        console.log('Session after Google redirect:', session ? 'Valid' : 'None');
      }

      await debugSessionStorage();  // Debug log

      const finalSession = await authClient.getSession();  // Final check
      if (result.error || !finalSession) {
        console.error('Google sign-in error:', result.error);
        Alert.alert('Google Sign In Failed', result.error?.message || 'No session created—check server logs');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err.code === 'ERR_CANCELED') errorMessage = 'Sign in was canceled';
      else if (err.message?.includes('not completed')) errorMessage = 'Sign up could not be completed.';
      else if (err.message?.includes('redirect_uri_mismatch')) errorMessage = 'Redirect config error—check scheme.';
      else if (err.message?.includes('invalid_client')) errorMessage = 'Client credentials invalid—check env vars.';
      Alert.alert('Google Sign In Error', errorMessage);
    }
  };

  const filteredStrategies = SOCIAL_CONNECTION_STRATEGIES.filter(
    (strategy) => strategy.type !== 'apple' || Platform.OS === 'ios'
  );

  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {filteredStrategies.map((strategy) => (
        <Button
          key={strategy.type}
          variant="outline"
          size="lg"
          className="sm:flex-1 gap-4"
          onPress={() => strategy.type === 'apple' ? handleAppleSignIn() : handleGoogleSignIn()}
        >
          <Image
            className={cn('size-4', strategy.useTint && Platform.select({ web: 'dark:invert' }))}
            tintColor={Platform.select({
              native: strategy.useTint ? (colorScheme === 'dark' ? 'white' : 'black') : undefined,
            })}
            source={strategy.source}
          />
          <Text>{strategy.label}</Text>
        </Button>
      ))}
    </View>
  );
}

const useWarmUpBrowser = Platform.select({
  web: () => {},
  default: () => {
    React.useEffect(() => {
      void WebBrowser.warmUpAsync();
      return () => void WebBrowser.coolDownAsync();
    }, []);
  },
});