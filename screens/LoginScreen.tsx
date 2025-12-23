import React, { useState } from 'react';
import { View, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { ShieldCheck } from 'lucide-react-native';

// --- React Native Reusables Imports ---
// (Ensure these components are generated in your /components/ui folder)
import { Button } from '@/components/ui/button'; 
import { Text } from '@/components/ui/text';

GoogleSignin.configure({
  scopes: ['email', 'profile'],
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;
        if (data.session) await initializeUserProfile(data.session.user.id);
      }
    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') {
        Alert.alert('Error', e.message || 'Apple Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        if (error) throw error;
        if (data.session) await initializeUserProfile(data.session.user.id);
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Error', 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('id').eq('id', userId).single();
    if (!data) {
      await supabase.from('profiles').insert({
        id: userId,
        life_tree_stage: 1,
        current_streak: 0,
        xp_points: 0
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
    {/* 1. Background Gradient using Theme Variables */}
    {/* Note: We use the 'background' variable for the base and 'muted' or 'card' for the depth */}
    <LinearGradient
      colors={['#020617', '#0f172a', '#020617']} // Or use tailwind color names if configured
      className="absolute inset-0"
    />

    <SafeAreaView className="flex-1 px-6 justify-between">
      
      {/* 2. Header Section */}
      <View className="flex-1 justify-center items-center mt-12">
        {/* Using primary/10 for that subtle brand glow */}
        <View className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 justify-center items-center mb-6 shadow-2xl shadow-primary/40">
          <ShieldCheck size={48} className="text-primary" />
        </View>
        
        <Text className="text-foreground text-4xl font-extrabold tracking-[4px] uppercase">
          Unhooked
        </Text>
        
        <Text className="text-muted-foreground text-center mt-4 text-lg font-medium px-4">
          Break free. Stand firm. Grow roots.
        </Text>
      </View>

      {/* 3. Auth Buttons Section */}
      <View className="w-full pb-10 gap-4">
        {loading ? (
          <View className="h-24 justify-center">
            <ActivityIndicator size="large" className="text-primary" />
          </View>
        ) : (
          <>
            {/* Apple Button (Requires hex values for native styling) */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={16}
                style={{ width: '100%', height: 56 }}
                onPress={handleAppleLogin}
              />
            )}

            {/* Google Button using 'secondary' or 'outline' for contrast */}
            <Button 
              variant="secondary" 
              className="rounded-2xl h-[56px] flex-row gap-3 shadow-sm active:opacity-90 bg-white border-0"
              onPress={handleGoogleLogin}
            >
              <Image 
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
                className="w-5 h-5" 
              />
              <Text className="text-black font-semibold text-lg">Continue with Google</Text>
            </Button>
          </>
        )}

        {/* Legal text using 'muted-foreground' */}
        <View className="mt-6 px-6">
          <Text className="text-muted-foreground text-xs text-center leading-5">
            By continuing, you agree to our{' '}
            <Text className="text-foreground font-semibold underline text-xs">Terms</Text>
            {' '}and{' '}
            <Text className="text-foreground font-semibold underline text-xs">Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  </View>
   );
}