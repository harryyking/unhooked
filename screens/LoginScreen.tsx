import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Image, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { ShieldCheck } from 'lucide-react-native'; // Or your icon library

// Configure Google Sign-In once (outside component)
GoogleSignin.configure({
  scopes: ['email', 'profile'],
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Setup in .env
});

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. APPLE SIGN IN LOGIC
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
        
        // Setup user profile if it's their first time
        if (data.session) {
           await initializeUserProfile(data.session.user.id);
        }
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') {
        // User cancelled, do nothing
      } else {
        Alert.alert('Error', e.message || 'Apple Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. GOOGLE SIGN IN LOGIC
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

        if (data.session) {
          await initializeUserProfile(data.session.user.id);
        }
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Google Sign-In failed. Please try again.');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Helper to create the initial Profile row
  const initializeUserProfile = async (userId: string) => {
    // Check if profile exists first to avoid overwriting data
    const { data } = await supabase.from('profiles').select('id').eq('id', userId).single();
    
    if (!data) {
      await supabase.from('profiles').insert({
        id: userId,
        life_tree_stage: 1, // Start as a seed
        current_streak: 0,
        xp_points: 0
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient for a "Hopeful" vibe */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.content}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={40} color="#4ADE80" />
          </View>
          <Text style={styles.appName}>UNHOOKED</Text>
          <Text style={styles.tagline}>Break free. Stand firm. Grow roots.</Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.authContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#4ADE80" style={{ marginBottom: 40 }} />
          ) : (
            <>
              {/* Native Apple Button */}
              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={14}
                  style={styles.appleButton}
                  onPress={handleAppleLogin}
                />
              )}

              {/* Custom Google Button */}
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
                  style={styles.googleIcon} 
                />
                <Text style={styles.googleText}>Sign in with Google</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.legalText}>
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            We do not sell your data.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.1)', // Subtle green glow
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  authContainer: {
    width: '100%',
    paddingBottom: 40,
    gap: 16,
  },
  appleButton: {
    width: '100%',
    height: 54,
  },
  googleButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleText: {
    color: '#000000',
    fontSize: 19,
    fontWeight: '500', // Matches Apple's font weight
  },
  legalText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  }
});