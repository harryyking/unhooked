import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import Constants from 'expo-constants';
import { ConvexClientProvider } from '@/components/convexclientProvider'; // Adjust path if needed
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Define notification channel for Android
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Check-In Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

// Global notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, 
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Times for 7 reminders
const REMINDER_TIMES = [
  { hour: 7, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 17, minute: 30 },
  { hour: 21, minute: 0 },
  { hour: 23, minute: 30 },
  { hour: 2, minute: 0 },
];

const getClerkPublishableKey = (): string => {
  const envKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const configKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  
  const publishableKey = envKey || configKey;
  
  if (!publishableKey) {
    throw new Error(
      'Clerk publishable key not found. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file or add clerkPublishableKey to app.json extra field'
    );
  }
  
  return publishableKey;
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  // Global listeners and initial check for reminders
  React.useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      Alert.alert('Check-In', 'Time to reflect on your recovery journey!');
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Check and schedule on app start if enabled
    checkAndScheduleReminders();

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  return (
    <ClerkProvider 
      publishableKey={getClerkPublishableKey()}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
      <ConvexClientProvider>
        <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Routes />
          <PortalHost />
        </ThemeProvider>
      </ConvexClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

SplashScreen.preventAutoHideAsync();

function Routes() {
  const { isSignedIn, isLoaded } = useAuth();

  React.useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack>
      {/* Screens only shown when the user is NOT signed in */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="quizzes" options={{headerShown: false}} />
        <Stack.Screen name="onboarding" options={{headerShown: false}} />
        <Stack.Screen name="(auth)/sign-up" options={SIGN_UP_SCREEN_OPTIONS} />
      </Stack.Protected>

      {/* Screens only shown when the user IS signed in */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{headerShown:false}} />
      </Stack.Protected>

      {/* Screens outside the guards are accessible to everyone (e.g. not found) */}
    </Stack>
  );
}

const SIGN_IN_SCREEN_OPTIONS = {
  headerShown: false,
  title: 'Sign in',
};

const SIGN_UP_SCREEN_OPTIONS = {
  presentation: 'modal',
  title: '',
  headerTransparent: true,
  gestureEnabled: false,
} as const;

const DEFAULT_AUTH_SCREEN_OPTIONS = {
  title: '',
  headerShadowVisible: false,
  headerTransparent: true,
};

// Helper: Request permissions
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission Denied', 'Notifications are required for reminders. Please enable them in settings.');
    return false;
  }

  await setupNotificationChannel();
  return true;
}

// Helper: Schedule reminders
async function scheduleDailyReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const scheduledIds = [];

  for (const time of REMINDER_TIMES) {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Faith Check-In Reminder',
        body: 'Remember, overcoming porn addiction strengthens your walk with God. Stay strong in your recovery today! Your faith is worth the fight.',
        sound: true,
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true, // Repeat daily
        channelId:  Platform.OS === 'android' ? 'reminders' : undefined,
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR
      },
    });
    scheduledIds.push(notificationId);
  }

  console.log('Scheduled', scheduledIds.length, 'daily reminders');
}

// Helper: Check persisted state and schedule if enabled
async function checkAndScheduleReminders() {
  const isEnabled = await SecureStore.getItemAsync('remindersEnabled');
  if (isEnabled === 'true') {
    const hasPermissions = await requestNotificationPermissions();
    if (hasPermissions) {
      await scheduleDailyReminders();
    }
  }
}

// Export for use in settings
export async function enableReminders() {
  const hasPermissions = await requestNotificationPermissions();
  if (hasPermissions) {
    await scheduleDailyReminders();
    await SecureStore.setItemAsync('remindersEnabled', 'true');
    Alert.alert('Success', '7 daily check-in reminders scheduled!');
  }
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await SecureStore.setItemAsync('remindersEnabled', 'false');
  Alert.alert('Cancelled', 'All check-in reminders have been cancelled.');
}