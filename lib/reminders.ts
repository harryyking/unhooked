import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';


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
      Alert.alert(
        'Permission Denied',
        'Notifications are required for reminders. Please enable them in settings.'
      );
      return false;
    }
  
    await setupNotificationChannel();
    return true;
  }

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
  
  // Helper: Schedule reminders
 export async function scheduleDailyReminders() {
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
          channelId: Platform.OS === 'android' ? 'reminders' : undefined,
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
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
  