import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message'; // 1. Import Toast
import { 
  InstrumentSans_400Regular, 
  InstrumentSans_700Bold, 
  InstrumentSans_600SemiBold, 
  useFonts 
} from '@expo-google-fonts/instrument-sans';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold
  });

  // --- Network Monitoring ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected === false) {
        Toast.show({
          type: 'error',
          text1: 'Offline Mode',
          text2: 'Some features like SOS and AI require internet.',
          autoHide: false, // Keep it visible while offline
          position: 'top',
        });
      } else if (state.isConnected === true) {
        // Hide the offline toast and show a quick success one
        Toast.hide();
        Toast.show({
          type: 'success',
          text1: 'Back Online',
          text2: 'Connection restored.',
          visibilityTime: 3000,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Auth Logic ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // --- Navigation Guard ---
  useEffect(() => {
    if (!initialized || !fontsLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    
    if (session && inAuthGroup) {
      router.replace('/(tabs)/home');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/');
    }
  }, [session, initialized, segments, fontsLoaded]);

  if (!fontsLoaded || !initialized) {
    return <View style={{flex:1, justifyContent:'center', backgroundColor: '#0f172a'}}><ActivityIndicator color="#4ADE80" /></View>;
  }

  return (
    <>
      <Slot />
      {/* 2. Place the Toast component at the very bottom of your return */}
      <Toast /> 
    </>
  );
}