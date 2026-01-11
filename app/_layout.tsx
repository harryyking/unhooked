import '@/global.css';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 1. Import TanStack Query
import {
  DMSans_300Light,
  DMSans_100Thin,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // 1. Import Gesture Handler
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'; // 2. Import Bottom Sheet Provider
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ThemeProvider } from '@react-navigation/native';
import { NAV_THEME } from '@/lib/theme';
import AuthProvider from '@/providers/AuthProvider';
import { SplashScreenController } from '@/components/SplashScreenController';
import { useAuthContext } from '@/hooks/UseAuthContext';
import { StatusBar } from 'expo-status-bar';

// 2. Initialize the QueryClient outside the component to prevent re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function RootNavigator() {
  const { isLoggedIn } = useAuthContext();
  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name= "(paywall)" options={{headerShown: false}}/>
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Sans-Regular': DMSans_400Regular,
    'Sans-Medium': DMSans_500Medium,
    'Sans-Bold': DMSans_700Bold,
    DMSans_300Light,
    DMSans_100Thin,
    'Sans-SemiBold': DMSans_600SemiBold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 1. Wrap the tree in KeyboardProvider */}
      <ThemeProvider value={NAV_THEME['dark']}>
        <KeyboardProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <SplashScreenController/>
                <StatusBar style="auto" />
                <RootNavigator />
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </AuthProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
