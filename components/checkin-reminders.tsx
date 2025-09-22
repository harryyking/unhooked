import React, { useEffect, useRef } from 'react';
import { View, Button, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, 
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Times for 7 reminders (in 24-hour format, spaced ~3.5 hours apart starting at 7 AM)
const REMINDER_TIMES = [
  { hour: 7, minute: 0 },   // 7:00 AM
  { hour: 10, minute: 30 }, // 10:30 AM
  { hour: 14, minute: 0 },  // 2:00 PM
  { hour: 17, minute: 30 }, // 5:30 PM
  { hour: 21, minute: 0 },  // 9:00 PM
  { hour: 23, minute: 30 }, // 11:30 PM
  { hour: 2, minute: 0 },   // 2:00 AM (gentle overnight reminder)
];

export default function CheckInReminders() {
  const hasRequestedPermissions = useRef(false);

  useEffect(() => {
    // Listen for notification taps (e.g., navigate to check-in screen)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle navigation, e.g., to a check-in modal or screen
      // Example: router.push('/checkin'); (if using Expo Router)
      Alert.alert('Check-In', 'Time to reflect on your recovery journey!');
    });

    // Listen for when notification is received in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  const requestPermissions = async () => {
    if (hasRequestedPermissions.current) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Notifications are required for reminders. Please enable them in settings.');
      return;
    }

    await setupNotificationChannel();
    hasRequestedPermissions.current = true;
    await scheduleDailyReminders();
  };

  const scheduleDailyReminders = async () => {
    // Cancel any existing notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const scheduledIds: string[] = [];

    for (const time of REMINDER_TIMES) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Faith Check-In Reminder',
          body: 'Remember, overcoming porn addiction strengthens your walk with God. Stay strong in your recovery today! Your faith is worth the fight.',
          sound: true, // Default sound
          // data: { screen: 'CheckIn' }, // Optional: Pass data to handle on tap
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
    Alert.alert('Success', `7 daily check-in reminders scheduled! They will remind you about your recovery and faith journey.`);
  };

  const cancelReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert('Cancelled', 'All check-in reminders have been cancelled.');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button title="Enable Daily Check-In Reminders" onPress={requestPermissions} />
      <Button title="Cancel Reminders" onPress={cancelReminders} color="red" />
    </View>
  );
}