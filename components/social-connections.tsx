import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import { Alert, Image, Platform, View, type ImageSourcePropType, AppState } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { StartSSOFlowParams, useSSO } from '@clerk/clerk-expo';

WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = 'unhooked';

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
    useTint: true,
    label: 'Continue with Apple',
  },
  {
    type: 'oauth_google',
    source: { uri: 'https://img.clerk.com/static/google.png?width=160' },
    useTint: false,
    label: 'Continue with Google',
  },
];

export function SocialConnections() {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();
  const { startSSOFlow } = useSSO();
  const authInProgress = React.useRef(false);

  // More conservative approach: Only dismiss if user backgrounds app during active auth
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (authInProgress.current && nextAppState === 'background') {
        // Give a small delay to allow natural OAuth completion
        setTimeout(() => {
          if (authInProgress.current) {
            AuthSession.dismiss();
            authInProgress.current = false;
          }
        }, 500);
      }
    });
    return () => {
      subscription?.remove();
    };
  }, []);

  function onSocialLoginPress(strategy: SocialConnectionStrategy) {
    return async () => {
      if (authInProgress.current) {
        console.log('Auth already in progress, ignoring press');
        return;
      }
      try {
        authInProgress.current = true;
       
        const redirectUrl = AuthSession.makeRedirectUri(Platform.select({
          native: { scheme: APP_SCHEME, path: 'auth' },
          web: {},
        }));
       
        console.log('Starting SSO flow with redirectUrl:', redirectUrl);
        const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
          strategy,
          redirectUrl,
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          authInProgress.current = false;
          return;
        }
        if (signIn || signUp) {
          const nextStep = signIn?.status || signUp?.status;
          console.warn(`Unexpected pending state: ${nextStep}. Check Clerk Dashboard for mandatory fields or MFA.`);
          authInProgress.current = false;
          return;
        }
        authInProgress.current = false;
        Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');
      } catch (err: any) {
        authInProgress.current = false;
       
        if (err?.code === 'ERR_REQUEST_CANCELED' || err?.message?.includes('canceled')) {
          console.log('User canceled SSO flow');
          AuthSession.dismiss();
          return;
        }
       
        const errorDetails = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('SSO Error:', err);
        Alert.alert('Login Failed', `Could not complete login: ${errorDetails}`);
        AuthSession.dismiss();
      }
    };
  }

  return (
    <View className="gap-2">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => (
        (strategy.type !== 'oauth_apple' || Platform.OS === 'ios') ? (
          <Button
            key={strategy.type}
            variant="outline"
            size="lg"
            className="gap-4"
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
}

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);
};