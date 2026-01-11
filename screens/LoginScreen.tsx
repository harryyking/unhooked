import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';
  
// --- UI Components ---
import { Text } from '@/components/ui/text';
import GoogleSignInButton from '@/components/socialButtons/GoogleSignInButton';
import AppleSignInButton from '@/components/socialButtons/AppleSignInButton';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 1. Immersive Deep Sea Background */}
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject} 
      />
    

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER SECTION: Branding */}
        <View className='flex-1 justify-center items-center'>
      
          
          <Text variant={'h2'}>Unhooked</Text>
          <View style={styles.taglineWrapper}>
            <Text style={styles.tagline}>Break free. Stand firm.</Text>
            <Text style={[styles.tagline, { color: '#5eead4' }]}> Grow roots.</Text>
          </View>
        </View>

        {/* AUTH SECTION: Social Buttons */}
        <View style={styles.authSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5eead4" />
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <Text style={styles.authLabel}>Begin your journey</Text>
              
              <View style={styles.buttonStack}>
                {/* Wrap buttons to ensure consistent sizing */}
                <View style={styles.buttonWrapper}>
                   <AppleSignInButton />
                </View>
                
                <View style={styles.buttonWrapper}>
                   <GoogleSignInButton />
                </View>
              </View>

            </View>
          )}

          {/* LEGAL FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.legalText}>
              Your privacy is our priority. By continuing, you agree to our{' '}
              <Text style={styles.legalLink}>Terms</Text> and{' '}
              <Text style={styles.legalLink}>Privacy</Text>.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  
  // Visual Effects
  ambientGlow: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#0d9488',
    borderRadius: width * 0.3,
    opacity: 0.15,
  },

  // Header Styles
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 32,
    // Outer shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  logoGlass: {
    width: 110,
    height: 110,
    borderRadius: 35, // More organic "squircle"
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandName: {
    color: '#FFF',
    fontSize: 32,
    fontFamily: 'Serif-Bold',

  },
  taglineWrapper: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: 'Sans-Regular',
  },

  // Auth Section
  authSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  authLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontFamily: 'Sans-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 24,
  },
  buttonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonStack: {
    gap: 16,
  },
  buttonWrapper: {
    width: '100%',
    height: 56, // Fixed height for both buttons
    overflow: 'hidden',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
  },

  // Guest Access
  guestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  guestText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontFamily: 'Sans-Medium',
  },

  // Footer
  footer: {
    marginTop: 32,
    paddingHorizontal: 10,
  },
  legalText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Sans-Regular',
  },
  legalLink: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});