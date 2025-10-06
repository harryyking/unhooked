import { Platform, StatusBar, StyleSheet, Text, View, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import HomeTabs from '@/components/hometabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { cancelReminders, enableReminders, requestNotificationPermissions } from '@/lib/reminders';


const HomeScreen = () => {
  useEffect(() => {
    // On home screen load (after sign-in), check if reminders are enabled
    const initReminders = async () => {
      const isEnabled = await SecureStore.getItemAsync('remindersEnabled');
      if (isEnabled !== 'true') {
        // Ask user to enable reminders
        Alert.alert(
          'Daily Reminders',
          'Would you like to set up 7 daily check-in reminders to support your recovery? Notifications include audio alerts.',
          [
            { text: 'No Thanks', style: 'cancel' },
            {
              text: 'Yes, Enable',
              onPress: async () => {
                await enableReminders();  // Requests permissions, schedules, stores flag
              },
            },
          ]
        );
      } else {
        // Already enabled: Ensure permissions and reschedule (in case revoked)
        const hasPermissions = await requestNotificationPermissions();
        if (hasPermissions) {
          await scheduleDailyReminders();
        } else {
          // If permissions revoked, prompt to re-enable
          Alert.alert(
            'Permissions Needed',
            'Reminders require notification access. Would you like to enable them?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => cancelReminders() },
              { text: 'Enable', onPress: () => enableReminders() },
            ]
          );
        }
      }
    };

    initReminders();
  }, []);

  return (
    <SafeAreaView className='flex-1'>
      <HomeTabs/>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
});

function scheduleDailyReminders() {
  throw new Error('Function not implemented.');
}
