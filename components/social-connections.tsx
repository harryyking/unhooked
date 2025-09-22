import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSSO, type StartSSOFlowParams } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react'; // Import for Convex mutation
import { api } from '@/convex/_generated/api'; // Your Convex API
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import { Image, Platform, View, type ImageSourcePropType, } from 'react-native';
import { useUser } from '@clerk/clerk-expo'; // Import to get user profile data

WebBrowser.maybeCompleteAuthSession();

type SocialConnectionStrategy = Extract<
  StartSSOFlowParams['strategy'],
  'oauth_google' | 'oauth_apple'
>;

const SOCIAL_CONNECTION_STRATEGIES: {
  type: SocialConnectionStrategy;
  source: ImageSourcePropType;
  useTint?: boolean;
  label: string;
}[] = [
  {
    type: 'oauth_apple',
    source: { uri: 'https://img.clerk.com/static/apple.png?width=160' },
    label: 'Sign in with Apple',
    useTint: true,
  },
  {
    type: 'oauth_google',
    source: { uri: 'https://img.clerk.com/static/google.png?width=160' },
    label: 'Sign in with Google',
    useTint: false,
  },
];

export function SocialConnections() {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();
  const { startSSOFlow } = useSSO();
  const createOrUpdateUser = useMutation(api.user.createOrUpdateUser); // Hook to call the mutation (adjust path if needed)
  const { user } = useUser(); // Get Clerk user data (optional, for pre-filling name)

  async function onSocialLoginPress(strategy: SocialConnectionStrategy) {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn } = await startSSOFlow({
        strategy,
        // For web, defaults to current path
        // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
        // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      // If sign in was successful, set the active session
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        // Now create/update the user in Convex
        try {
          const userId = await createOrUpdateUser({
            name: user?.fullName || user?.username || undefined,
            email: user?.primaryEmailAddress?.emailAddress || undefined // Optional: Pre-fill from Clerk user
            // Add avatarUrlId or orgId if available from Clerk or app logic
          });
          console.log('Convex user created/updated with ID:', userId);

          // Redirect to home or profile after success
          router.replace('/(tabs)/home'); // Adjust to your route
        } catch (mutationErr) {
          console.error('Error creating/updating Convex user:', mutationErr);
          // Optional: Show alert or retry logic
        }

        return;
      }

      // TODO: Handle other statuses (e.g., MFA required)
      // If there is no `createdSessionId`,
      // there are missing requirements, such as MFA
      // Use the `signIn` or `signUp` returned from `startSSOFlow`
      // to handle next steps
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  }

  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => {
        return (
          <Button
            key={strategy.type}
            variant="outline"
            size="lg"
            className="sm:flex-1 gap-2"
            onPress={() => onSocialLoginPress(strategy.type)}>
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