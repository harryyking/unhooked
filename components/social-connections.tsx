import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation } from 'convex/react'; // Import for Convex mutation
import { api } from '@/convex/_generated/api'; // Your Convex API
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import * as AppleAuthentication from 'expo-apple-authentication'; // Add this for native Apple flow
import { Alert, Image, Platform, View, type ImageSourcePropType, } from 'react-native';
import { authClient } from '@/lib/auth-client'; // Import the auth client

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
  const createOrUpdateUser = useMutation(api.user.createOrUpdateUser); // Hook to call the mutation (adjust path if needed)

  const handleSocialLogin = async (strategy: 'google' | 'apple') => {
    try {
      if (strategy === 'apple') {
        // Native Apple Sign In flow for iOS
        if (Platform.OS !== 'ios') {
          Alert.alert('Apple Sign In', 'Only available on iOS');
          return;
        }

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          state: Math.random().toString(36).substring(7), // Optional state for security
        });

        // Extract nonce if needed (generate and hash it client-side for Apple's nonce support)
        // For simplicity, omitting nonce unless your server requires it; add if needed
        const { identityToken } = credential;

        if (!identityToken) {
          throw new Error('Apple Sign In failed: No identity token returned');
        }

        // Pass to Better Auth
        await authClient.signIn.social({
          provider: 'apple',
          idToken: {
            token: identityToken,
          },
          callbackURL: '/(tabs)/home',
        });
      } else {
        // Google: Use standard social flow (web-based, works cross-platform)
        await authClient.signIn.social({
          provider: strategy,
          callbackURL: '/(tabs)/home',
        });
      }

      // On success, redirect happens via deep link; sync user if needed in the target route
    } catch (err: any) {
      console.error('Social sign-in failed:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err.code === 'ERR_CANCELED') {
        errorMessage = 'Sign in was canceled';
      } else if (err.message?.includes('Sign-up not completed') || err.message?.includes('not completed')) {
        errorMessage = 'Sign up could not be completed. Please check your Apple ID setup.';
      }
      Alert.alert('Sign In Error', errorMessage);
    }
  };

  // Only render Apple button on iOS
  const filteredStrategies = SOCIAL_CONNECTION_STRATEGIES.filter(
    (strategy) => strategy.type !== 'apple' || Platform.OS === 'ios'
  );

  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => {
        return (
          <Button
            key={strategy.type}
            variant="outline"
            size="lg"
            className="sm:flex-1 gap-4"
            onPress={() => handleSocialLogin(strategy.type)}>
            <Image
              className={cn('size-4', strategy.useTint && Platform.select({ web: 'dark:invert' }))}
              tintColor={Platform.select({
                native: strategy.useTint ? (colorScheme === 'dark' ? 'white' : 'black') : undefined,
              })}
              source={strategy.source} 
            />
           <Text>{strategy.label}</Text> 
          </Button>
        );
      })}
    </View>
  );
}


const useWarmUpBrowser = Platform.select({
  web: () => {},
  default: () => {
    React.useEffect(() => {
      // Preloads the browser for Android devices to reduce authentication load time
      // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
      void WebBrowser.warmUpAsync();
      return () => {
        // Cleanup: closes browser when component unmounts
        void WebBrowser.coolDownAsync();
      };
    }, []);
  },
});