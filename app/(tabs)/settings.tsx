import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, Linking, Share, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { enableReminders, cancelReminders } from '../_layout'; // Import from RootLayout

// iOS-style settings group component
const SettingsGroup = React.memo(
  ({ title, children, footerText }: { title?: string; children: React.ReactNode; footerText?: string }) => (
    <View className="mb-8">
      {title && (
        <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-4 pb-2">
          {title}
        </Text>
      )}
      <View className="bg-secondary mx-4 rounded-xl overflow-hidden shadow-sm">
        {children}
      </View>
      {footerText && (
        <Text className="text-xs text-muted-foreground px-4 pt-2 leading-4">
          {footerText}
        </Text>
      )}
    </View>
  )
);

// iOS-style settings item component
const SettingsItem = React.memo(
  ({
    icon,
    iconColor,
    iconBackgroundColor,
    label,
    value,
    onPress,
    isSwitch = false,
    switchValue,
    onSwitchChange,
    isLast = false,
    isDestructive = false,
    isLink = false,
  }: {
    icon?: React.ReactNode;
    iconColor?: string;
    iconBackgroundColor?: string;
    label: string;
    value?: string;
    onPress?: () => void;
    isSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    isLast?: boolean;
    isDestructive?: boolean;
    isLink?: boolean;
  }) => {
    const { colorScheme } = useColorScheme();

    return (
      <View>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 min-h-[44px]"
          onPress={onPress}
          disabled={isSwitch}
          activeOpacity={0.6}
        >
          {icon && (
            <View
              className="w-7 h-7 rounded-md items-center justify-center mr-3"
              style={{ backgroundColor: iconBackgroundColor || 'transparent' }}
            >
              {icon}
            </View>
          )}
          <View className="flex-1 flex-row items-center justify-between">
            <Text
              className={`text-base ${isDestructive ? 'text-destructive' : isLink ? 'text-blue-500' : 'text-foreground'}`}
            >
              {label}
            </Text>
            <View className="flex-row items-center">
              {value && (
                <Text className="text-muted-foreground text-base mr-2">
                  {value}
                </Text>
              )}
              {isSwitch ? (
                <Switch
                  value={switchValue}
                  onValueChange={onSwitchChange}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor="#ffffff"
                />
              ) : (
                onPress && (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colorScheme === 'dark' ? '#8E8E93' : '#C7C7CC'}
                  />
                )
              )}
            </View>
          </View>
        </TouchableOpacity>
        {!isLast && (
          <View className="h-px bg-border ml-12" style={{ marginLeft: icon ? 48 : 16 }} />
        )}
      </View>
    );
  }
);

const Settings = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize reminders state from SecureStore
  useEffect(() => {
    const loadRemindersState = async () => {
      try {
        const isEnabled = await SecureStore.getItemAsync('remindersEnabled');
        setRemindersEnabled(isEnabled === 'true');
      } catch (error) {
        console.error('Error loading reminders state:', error);
      }
    };
    loadRemindersState();
  }, []);

  // Network state listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newIsDark = !prev;
      setColorScheme(newIsDark ? 'dark' : 'light');
      return newIsDark;
    });
  }, [setColorScheme]);

  const toggleReminders = useCallback(
    async (value: boolean) => {
      if (!isOnline && value) {
        Alert.alert('Offline', 'Cannot enable reminders while offline. Please connect to the internet.');
        return;
      }

      setRemindersEnabled(value);
      try {
        if (value) {
          await enableReminders();
        } else {
          await cancelReminders();
        }
      } catch (error) {
        console.error('Error toggling reminders:', error);
        setRemindersEnabled(!value); // Revert on error
        Alert.alert('Error', 'Failed to update reminders. Please try again.');
      }
    },
    [isOnline]
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: 'Check out Unhooked! The app that helps you disconnect and live better.',
        url: 'https://unhooked.app',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  }, []);

  const openLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening link:', error);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              router.replace('/(auth)/sign-up');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  }, [ router]);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View className="px-4 py-6 bg-background">
          <Text className="text-2xl font-bold mb-1 text-foreground">Settings</Text>
          <Text className="text-muted-foreground text-sm">
            Manage your preferences and account
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <SettingsGroup title="Account">
            <SettingsItem
              icon={<MaterialCommunityIcons name="account-circle-outline" size={20} color="white" />}
              iconBackgroundColor="#007AFF"
              label="Edit Profile"
              onPress={() => {
                router.push('/account')
              }}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="logout" size={20} color="white" />}
              iconBackgroundColor="#FF3B30"
              label="Sign Out"
              onPress={handleSignOut}
              isLast
              isDestructive
            />
          </SettingsGroup>

          <SettingsGroup
            title="Preferences"
            footerText="Dark mode reduces eye strain in low-light conditions and may help save battery life on OLED displays."
          >
            <SettingsItem
              icon={
                <MaterialCommunityIcons
                  name={isDark ? 'weather-night' : 'weather-sunny'}
                  size={20}
                  color="white"
                />
              }
              iconBackgroundColor={isDark ? '#5856D6' : '#FF9500'}
              label="Dark Mode"
              isSwitch
              switchValue={isDark}
              onSwitchChange={toggleTheme}
              isLast
            />
          </SettingsGroup>

          <SettingsGroup
            title="Notifications"
            footerText="Enable reminders to receive daily check-ins to support your recovery journey."
          >
            <SettingsItem
              icon={<Feather name="bell" size={20} color="white" />}
              iconBackgroundColor="#34C759"
              label="Daily Reminders"
              isSwitch
              switchValue={remindersEnabled}
              onSwitchChange={toggleReminders}
              isLast
            />
          </SettingsGroup>

          <SettingsGroup title="Help & Support">
            <SettingsItem
              icon={<Feather name="help-circle" size={20} color="white" />}
              iconBackgroundColor="#5856D6"
              label="FAQ"
              onPress={() => openLink('https://unhooked.app/faq')}
              isLink
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="email-outline" size={20} color="white" />}
              iconBackgroundColor="#FF9500"
              label="Contact Support"
              onPress={() => openLink('mailto:support@unhooked.app')}
              isLink
            />
            <SettingsItem
              icon={<Feather name="book" size={20} color="white" />}
              iconBackgroundColor="#32D74B"
              label="User Guide"
              onPress={() => openLink('https://unhooked.app/user-guide')}
              isLast
              isLink
            />
          </SettingsGroup>

          <SettingsGroup title="About">
            <SettingsItem
              icon={<MaterialCommunityIcons name="share-variant" size={20} color="white" />}
              iconBackgroundColor="#007AFF"
              label="Share Unhooked"
              onPress={handleShare}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="shield-check" size={20} color="white" />}
              iconBackgroundColor="#34C759"
              label="Privacy Policy"
              onPress={() => openLink('https://unhooked.app/privacy-policy')}
              isLink
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="file-document" size={20} color="white" />}
              iconBackgroundColor="#8E8E93"
              label="Terms of Service"
              onPress={() => openLink('https://unhooked.app/terms-of-service')}
              isLink
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="information" size={20} color="white" />}
              iconBackgroundColor="#5856D6"
              label="App Version"
              value="1.0.0"
              isLast
            />
          </SettingsGroup>

          <View className="items-center px-4 mb-8">
            <Text className="text-xs text-muted-foreground text-center">
              © 2025 Teens Aloud Foundation
            </Text>
            <Text className="text-xs text-muted-foreground text-center mt-1">
              All rights reserved
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Settings;