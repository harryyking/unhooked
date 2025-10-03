import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Text } from './ui/text';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, Image, Platform, View, type ImageSourcePropType } from 'react-native';
import * as AuthSession from 'expo-auth-session'; // Add for redirect URI
import { authClient } from '@/lib/auth-client';
import {
  GoogleSignin,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // From Google Console (Web client)
  offlineAccess: true, // Optional for refresh tokens
  hostedDomain: '', // Optional: restrict to domain
  forceCodeForRefreshToken: true, // Optional: force refresh token
  accountName: '', // Optional: pre-fill account
  iosClientId: process.env.GOOGLE_CLIENT_IOS_ID, // iOS Client ID
  googleServicePlistPath: '', // iOS plist path (auto if using Expo config plugin)
  openIdRealm: '', // Optional
  profileImageSize: 120, // Optional
});


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
  const createOrUpdateUser = useMutation(api.user.createOrUpdateUser);

  const handleAppleSignIn = async () => {
    try {
      // Native Apple Sign In (iOS only)
      if (Platform.OS !== 'ios') {
        Alert.alert('Apple Sign In', 'Only available on iOS');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        state: Math.random().toString(36).substring(7),
      });

      console.log(credential)

      const { identityToken } = credential;
      if (!identityToken) {
        throw new Error('Apple Sign In failed: No identity token returned');
      }

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'unhooked', // Matches your app.json scheme
        path: 'auth',
      });

      // Sign in via Better Auth
      const result = await authClient.signIn.social({
        provider: 'apple',
        idToken: { token: identityToken },
        callbackURL: redirectUrl, // Use deep link for native
      });

      if (result.data && 'user' in result.data) {
        const userData = result.data.user;
        const userName = credential.fullName?.givenName || userData.name || 'Anonymous';
        const userEmail = credential.email || userData.email;
        const tokenIdentifer = result.data.token

        await createOrUpdateUser({
          name: userName,
          email: userEmail,
          tokenIdentifier: tokenIdentifer!
        }).catch((error) => {
          console.error('Failed to sync user to Convex:', error);
        });
      } else {
        console.log('No user data in result; using credential fallback if available');
        // Fallback for Apple (only on first sign-in)
        if (credential.fullName || credential.email) {
          await createOrUpdateUser({
            name: credential.fullName?.givenName || 'Anonymous',
            email: credential.email!,
            tokenIdentifier: undefined
          }).catch((error) => {
            console.error('Failed to sync user to Convex:', error);
          });
        }
      }
      // Redirect on success
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Apple sign-in failed:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err.code === 'ERR_CANCELED') {
        errorMessage = 'Sign in was canceled';
      } else if (err.message?.includes('Sign-up not completed') || err.message?.includes('not completed')) {
        errorMessage = 'Sign up could not be completed. Please check your setup.';
      } else if (err.message?.includes('redirect_uri_mismatch') || err.message?.includes('redirect')) {
        errorMessage = 'Redirect configuration error. Check your app scheme and OAuth settings.';
      } else if (err.message?.includes('invalid_client') || err.message?.includes('client')) {
        errorMessage = 'Apple client credentials invalid. Check env vars in Convex dashboard.';
      }
      Alert.alert('Apple Sign In Error', errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error('Google Sign In failed: No ID token returned');
      }

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'unhooked', // Matches your app.json scheme
        path: 'auth',
      });

      // Google: Web-based OAuth with explicit redirect
      const result = await authClient.signIn.social({
        provider: 'google',
        idToken: {token: userInfo.data.idToken},
        callbackURL: redirectUrl, // Essential for native redirect
      });

      // Sync to Convex on success
      if (result.data && 'user' in result.data) {
        const userData = result.data.user;
        const userName = userData.name || 'Anonymous';
        const userEmail =  userData.email;
        const tokenIdentifer = result.data.token

        await createOrUpdateUser({
          name: userName,
          email: userEmail,
          tokenIdentifier: tokenIdentifer
        }).catch((error) => {
          console.error('Failed to sync user to Convex:', error);
        });
      } 
      // Redirect on success
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err.code === 'ERR_CANCELED') {
        errorMessage = 'Sign in was canceled';
      } else if (err.message?.includes('Sign-up not completed') || err.message?.includes('not completed')) {
        errorMessage = 'Sign up could not be completed. Please check your setup.';
      } else if (err.message?.includes('redirect_uri_mismatch') || err.message?.includes('redirect')) {
        errorMessage = 'Redirect configuration error. Check your app scheme and OAuth settings.';
      } else if (err.message?.includes('invalid_client') || err.message?.includes('client')) {
        errorMessage = 'Google client credentials invalid. Check env vars in Convex dashboard.';
      }
      Alert.alert('Google Sign In Error', errorMessage);
    }
  };

  // Filter strategies (Apple only on iOS)
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