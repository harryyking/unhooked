import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

async function onAppleButtonPress() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('Apple credential received:', credential);

    // Sign in to Supabase using the identityToken
    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('Supabase Apple Sign-in Error:', error.message);
        return;
      }

      if (data.session) {
        console.log('Successfully authenticated with Supabase');
        router.replace('/(tabs)/home');
      }
    }
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      console.log('User cancelled the login flow');
    } else {
      console.error('Apple Auth Error:', e);
    }
  }
}

export default function AppleSignInButton() {
  // Apple Sign-In is only required/supported on iOS
  if (Platform.OS !== 'ios') return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={30} // Matches your pill-shaped theme
      style={styles.button}
      onPress={onAppleButtonPress}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%', // Better for responsive layouts
    height: 56,    // Matches the height of your other quiz/home buttons
  },
});