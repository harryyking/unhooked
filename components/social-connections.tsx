import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import { Alert, Image, Platform, View, type ImageSourcePropType } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { StartSSOFlowParams, useSSO } from '@clerk/clerk-expo';// Call this at the module level to handle pending auth sessions
WebBrowser.maybeCompleteAuthSession();


// IMPORTANT: Ensure your app's scheme (e.g., 'unhooked') is defined in app.json under "expo.scheme".
// In Clerk Dashboard > API Keys > Authorized redirect URIs, add the exact URI your app generates, e.g., 'unhooked://auth' (without trailing slash).
// If Clerk only accepts with '/auth', use path: 'auth' in makeRedirectUri to match.
// For one-click sign-in: In Clerk Dashboard > User & Authentication > Sign-up, make all fields optional or enable progressive sign-up.
// Disable any MFA under Multi-factor. This ensures no pending steps after OAuth.const APP_SCHEME = 'unhooked'; 


const APP_SCHEME = 'unhooked'; 

type SocialConnectionStrategy = Extract<
  StartSSOFlowParams['strategy'],
  'oauth_google' | 'oauth_github' | 'oauth_apple'
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
];export function SocialConnections() {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();
  const { startSSOFlow } = useSSO();  function onSocialLoginPress(strategy: SocialConnectionStrategy) {
    return async () => {
      try {
        // Generate the platform-specific redirect URL matching your Clerk dashboard (e.g., unhooked://auth)
        const redirectUrl = AuthSession.makeRedirectUri(Platform.select({ 
          native: {
            scheme: APP_SCHEME,
            path: 'auth',  // Included as per your note—Clerk requires/accepts this path
          },
          web: {},
        }));    console.log('Starting SSO flow with redirectUrl:', redirectUrl);

    const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
      strategy,
      redirectUrl,
    });

    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
      // Optional: Navigate to home or let Protected stacks handle rerender
      // router.replace('/(tabs)');
      return;
    }

    // Handle pending state (e.g., if unexpected sign-up fields or MFA—shouldn't happen if config is one-click)
    if (signIn || signUp) {
      const nextStep = signIn?.status || signUp?.status;
      console.warn(`Unexpected pending state: ${nextStep}. Check Clerk Dashboard for mandatory fields or MFA.`);
      Alert.alert(
        'Additional Steps Needed',
        'Please complete the required information to continue.',
        // Here, you could navigate to a custom continue screen to handle missingFields
        // e.g., router.push('/continue-sign-up');
      );
      return;
    }

    // Fallback alert for unexpected issues
    Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');

  } catch (err) {
    const errorDetails = err instanceof Error ? err.message : 'An unknown error occurred.';
    console.error('SSO Error:', JSON.stringify(err, null, 2));
    Alert.alert('Login Failed', `Could not complete login: ${errorDetails}`);
  }
};  }  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => (
        // Conditionally render Apple only on iOS for better UX (optional)
        (strategy.type !== 'oauth_apple' || Platform.OS === 'ios') ? (
          <Button
            key={strategy.type}
            variant="outline"
            size="lg"
            className="sm:flex-1 gap-4"
            onPress={onSocialLoginPress(strategy.type)}
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
        ) : null
      ))}
    </View>
  );
}const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      void WebBrowser.warmUpAsync();
      return () => void WebBrowser.coolDownAsync();
    }
  }, []);
};

