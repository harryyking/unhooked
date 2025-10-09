import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import { Alert, Image, Platform, View, type ImageSourcePropType } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { StartSSOFlowParams, useSSO } from '@clerk/clerk-expo';

// IMPORTANT: The scheme has been updated to 'unhooked'.
// ENSURE this scheme is correctly defined in your app.json and configured 
// as an Authorized Redirect URI in the Clerk Dashboard.
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
];

export function SocialConnections() {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();
  const { startSSOFlow } = useSSO();

  function onSocialLoginPress(strategy: SocialConnectionStrategy) {
    return async () => {
      try {
        // --- FIX START: Explicitly defining the redirect URL for production native builds ---
        const redirectUrl = AuthSession.makeRedirectUri(Platform.select({ 
          native: {
            // Use the specific scheme and path for native apps (unhooked://auth)
            scheme: APP_SCHEME,
            path: 'auth', 
          },
          // For web, AuthSession defaults to the current path, which is usually correct.
          web: {},
        }));

        console.log('Starting SSO flow with redirectUrl:', redirectUrl);

        // --- UPDATED: Destructure signUp to handle new user flows ---
        const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
          strategy,
          redirectUrl, // Use the generated and configured redirectUrl
        });
        // --- FIX END ---

        // 1. If sign in was successful (most common path), set the active session
        if (createdSessionId && setActive) {
          setActive({ session: createdSessionId });
          return;
        }

        // 2. If no session was created, check if Clerk returned a partial signIn or signUp object.
        // This means further steps (like MFA or completing sign-up fields) are required.
        if (signIn || signUp) {
          const nextStep = signIn?.status || signUp?.status;
          
          // Log the state for debugging
          console.warn('SSO requires further action:', { 
            nextStep, 
            signInStatus: signIn?.status, 
            signUpStatus: signUp?.status, 
            sessionId: createdSessionId 
          });

          // Inform the user that extra steps are needed.
          Alert.alert(
            'Action Required', 
            `Social login needs to complete the '${nextStep}' step. This usually means a final sign-up field or MFA is needed.`,
          );
          
          // In a full application, you would use 'router.push()' here to navigate 
          // the user to the correct screen (e.g., /mfa, /complete-signup).
          return;
        }
        
        // 3. Fallback for unexpected successful flow without a session or next step
        Alert.alert(
          'Login Failed', 
          'Social login succeeded but failed to create a user session. Please check your Clerk dashboard settings.',
        );

      } catch (err) {
        // --- ERROR HANDLING FIX: Use Alert for visibility on native devices/production ---
        const errorDetails = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('SSO Error:', JSON.stringify(err, null, 2));
        
        // Show a user-facing alert
        Alert.alert(
          'Login Failed', 
          `Could not complete login. Please try again. (Details: ${errorDetails})`,
        );
        // --- ERROR HANDLING FIX END ---
      }
    };
  }

  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => (
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
