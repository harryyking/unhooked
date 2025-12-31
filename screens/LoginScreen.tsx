import React, { useState } from 'react';
import { View, Platform, ActivityIndicator, Image, Alert, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { ShieldCheck } from 'lucide-react-native';

// --- UI Components ---
import { Button } from '@/components/ui/button'; 
import { Text } from '@/components/ui/text';
import GoogleSignInButton from '@/components/socialButtons/GoogleSignInButton';
import AppleSignInButton from '@/components/socialButtons/AppleSignInButton';

const { width } = Dimensions.get('window');

GoogleSignin.configure({
  scopes: ['email', 'profile'],
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Background Gradient */}
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.glowEffect} />
            <ShieldCheck size={48} color="#FFF" strokeWidth={1.5} />
          </View>
          
          <Text style={styles.brandName}>UNHOOKED</Text>
          <Text style={styles.tagline}>Break free. Stand firm. Grow roots.</Text>
        </View>

        {/* AUTH BUTTONS SECTION */}
        <View style={styles.authContainer}>
          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#FFF" />
            </View>
          ) : (
            <View style={styles.buttonStack}>
            <AppleSignInButton/>

            <GoogleSignInButton/>
            </View>
          )}

          {/* LEGAL TEXT */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text style={styles.legalLink}>Terms</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 32 },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  glowEffect: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    filter: 'blur(20px)',
  },
  brandName: {
    color: '#FFF',
    fontSize: 32,
    fontFamily: 'Sans-Bold',
    letterSpacing: 6,
    textAlign: 'center',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontFamily: 'Serif-Regular',
    marginTop: 12,
    textAlign: 'center',
  },
  authContainer: { paddingBottom: 40 },
  buttonStack: { gap: 16 },
  appleButton: { width: '100%', height: 44 },
  googleButton: {
    height: 64,
    backgroundColor: '#FFF',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIcon: { width: 22, height: 22 },
  googleButtonText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'Sans-Medium',
  },
  loadingWrapper: { height: 144, justifyContent: 'center' },
  legalContainer: { marginTop: 32, paddingHorizontal: 20 },
  legalText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Sans-Regular',
  },
  legalLink: {
    color: '#FFF',
    textDecorationLine: 'underline',
    fontFamily: 'Sans-Medium',
  },
});