import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 1. Import TanStack Query
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts
} from '@expo-google-fonts/plus-jakarta-sans'
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // 1. Import Gesture Handler
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'; // 2. Import Bottom Sheet Provider
import { KeyboardProvider } from 'react-native-keyboard-controller';

// 2. Initialize the QueryClient outside the component to prevent re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold
  });

  // --- Network Monitoring ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected === false) {
        Toast.show({
          type: 'error',
          text1: 'Offline Mode',
          text2: 'Some features like SOS and AI require internet.',
          autoHide: true,
          visibilityTime: 5000,
          position: 'top',
        });
      } else if (state.isConnected === true) {
        Toast.hide();
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
      router.replace('/(auth)/login');
    }
  }, [session, initialized, segments, fontsLoaded]);

  if (!fontsLoaded || !initialized) {
    return (
      <View style={{flex:1, justifyContent:'center', backgroundColor: '#0f172a'}}>
        <ActivityIndicator color="#4ADE80" size="large" />
      </View>
    );
  }


  return (

    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 1. Wrap the tree in KeyboardProvider */}
      <KeyboardProvider> 
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <Slot />
            <Toast />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}