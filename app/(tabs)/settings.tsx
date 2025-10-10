import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, Linking, Share, Alert, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { enableReminders, cancelReminders } from '@/lib/reminders';
import { useClerk } from '@clerk/clerk-expo';

// iOS-style settings group component
const SettingsGroup = React.memo(
  ({ title, children, footerText }: { title?: string; children: React.ReactNode; footerText?: string }) => (
    <View className="mb-6">
      {title && (
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 pb-2">
          {title}
        </Text>
      )}
      <View className="bg-card mx-4 rounded-2xl overflow-hidden">
        {children}
      </View>
      {footerText && (
        <Text className="text-xs text-muted-foreground px-5 pt-2 leading-5">
          {footerText}
        </Text>
      )}
    </View>
  )
);

// iOS-style settings item component with enhanced haptics and press states
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
    badge,
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
    badge?: string;
  }) => {
    const { colorScheme } = useColorScheme();
    const [isPressed, setIsPressed] = useState(false);

    const handlePressIn = useCallback(() => {
      setIsPressed(true);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, []);

    const handlePressOut = useCallback(() => {
      setIsPressed(false);
    }, []);

    const handlePress = useCallback(() => {
      if (onPress) {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
      }
    }, [onPress]);

    return (
      <View>
        <TouchableOpacity
          className={`flex-row items-center px-4 py-3.5 min-h-[48px] ${isPressed && !isSwitch ? 'bg-muted/50' : ''}`}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isSwitch}
          activeOpacity={1}
        >
          {icon && (
            <View
              className="w-8 h-8 rounded-lg items-center justify-center mr-3 shadow-sm"
              style={{ backgroundColor: iconBackgroundColor || 'transparent' }}
            >
              {icon}
            </View>
          )}
          <View className="flex-1 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text
                className={`text-base ${
                  isDestructive ? 'text-red-500' : isLink ? 'text-blue-500' : 'text-foreground'
                } ${Platform.OS === 'ios' ? 'font-normal' : ''}`}
              >
                {label}
              </Text>
              {badge && (
                <View className="bg-red-500 px-1.5 py-0.5 rounded-full min-w-[18px] items-center justify-center">
                  <Text className="text-white text-xs font-semibold">{badge}</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-2">
              {value && (
                <Text className="text-muted-foreground text-base" numberOfLines={1}>
                  {value}
                </Text>
              )}
              {isSwitch ? (
                <Switch
                  value={switchValue}
                  onValueChange={(val) => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    onSwitchChange?.(val);
                  }}
                  trackColor={{ false: colorScheme === 'dark' ? '#39393D' : '#E5E5EA', true: '#34C759' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor={colorScheme === 'dark' ? '#39393D' : '#E5E5EA'}
                />
              ) : (
                onPress && (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={colorScheme === 'dark' ? '#636366' : '#C7C7CC'}
                  />
                )
              )}
            </View>
          </View>
        </TouchableOpacity>
        {!isLast && (
          <View
            className="h-[0.5px] bg-border/60"
            style={{ marginLeft: icon ? 56 : 16 }}
          />
        )}
      </View>
    );
  }
);

const Settings = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, user } = useClerk();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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
        Alert.alert(
          'No Internet Connection',
          'Please connect to the internet to enable reminders.',
          [{ text: 'OK', style: 'default' }]
        );
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
        setRemindersEnabled(!value);
        Alert.alert(
          'Unable to Update Reminders',
          'Please try again later.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    },
    [isOnline]
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: 'Check out Unhooked – an app that helps you stay focused on your recovery journey. https://unhooked.xyz',
        url: 'https://unhooked.xyz',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  }, []);

  const openLink = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Unable to Open Link', 'Please try again later.');
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
              await signOut();
              router.replace('/(auth)/sign-up');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Sign Out Failed', 'Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  }, [signOut, router]);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View className="px-5 pb-4 pt-2 bg-background">
          <Text className="text-4xl font-bold text-foreground tracking-tight">Settings</Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 8 }}
        >
          {/* Profile Card */}
          {user && (
            <View className="mx-4 mb-6 bg-card rounded-2xl p-4 flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center mr-4">
                <Text className="text-white text-2xl font-semibold">
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {user.emailAddresses[0]?.emailAddress}
                </Text>
              </View>
            </View>
          )}

          {/* Account Section */}
          <SettingsGroup title="Account">
            <SettingsItem
              icon={<MaterialCommunityIcons name="account-circle-outline" size={22} color="white" />}
              iconBackgroundColor="#007AFF"
              label="Manage Account"
              onPress={() => router.push('/account')}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="logout" size={22} color="white" />}
              iconBackgroundColor="#FF3B30"
              label="Sign Out"
              onPress={handleSignOut}
              isLast
              isDestructive
            />
          </SettingsGroup>

          {/* Appearance Section */}
          <SettingsGroup
            title="Appearance"
            footerText="Dark mode reduces eye strain in low-light environments and may help conserve battery life on OLED displays."
          >
            <SettingsItem
              icon={
                <MaterialCommunityIcons
                  name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
                  size={22}
                  color="white"
                />
              }
              iconBackgroundColor={isDark ? '#5E5CE6' : '#FF9F0A'}
              label="Dark Mode"
              isSwitch
              switchValue={isDark}
              onSwitchChange={toggleTheme}
              isLast
            />
          </SettingsGroup>

          {/* Notifications Section */}
          <SettingsGroup
            title="Notifications"
            footerText="Receive gentle daily reminders to check in with yourself and track your progress on your recovery journey."
          >
            <SettingsItem
              icon={<Feather name="bell" size={22} color="white" />}
              iconBackgroundColor="#30D158"
              label="Daily Check-In Reminders"
              isSwitch
              switchValue={remindersEnabled}
              onSwitchChange={toggleReminders}
              isLast
            />
          </SettingsGroup>

          {/* Support Section */}
          <SettingsGroup title="Support">
            <SettingsItem
              icon={<Feather name="help-circle" size={22} color="white" />}
              iconBackgroundColor="#5E5CE6"
              label="Frequently Asked Questions"
              onPress={() => openLink('https://unhooked.xyz/faq')}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="email-outline" size={22} color="white" />}
              iconBackgroundColor="#FF9F0A"
              label="Contact Support"
              onPress={() => openLink('mailto:support@unhooked.xyz')}
            />
            <SettingsItem
              icon={<Feather name="book-open" size={22} color="white" />}
              iconBackgroundColor="#32D74B"
              label="User Guide"
              onPress={() => openLink('https://unhooked.xyz/guide')}
              isLast
            />
          </SettingsGroup>

          {/* Resources Section */}
          <SettingsGroup title="Resources">
            <SettingsItem
              icon={<MaterialCommunityIcons name="heart-outline" size={22} color="white" />}
              iconBackgroundColor="#FF375F"
              label="Crisis Resources"
              onPress={() => openLink('https://unhooked.xyz/crisis')}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="account-group" size={22} color="white" />}
              iconBackgroundColor="#64D2FF"
              label="Community Guidelines"
              onPress={() => openLink('https://unhooked.xyz/community')}
              isLast
            />
          </SettingsGroup>

          {/* About Section */}
          <SettingsGroup title="About">
            <SettingsItem
              icon={<MaterialCommunityIcons name="share-variant-outline" size={22} color="white" />}
              iconBackgroundColor="#007AFF"
              label="Share Unhooked"
              onPress={handleShare}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="shield-check-outline" size={22} color="white" />}
              iconBackgroundColor="#30D158"
              label="Privacy Policy"
              onPress={() => openLink('https://unhooked.xyz/privacy')}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="file-document-outline" size={22} color="white" />}
              iconBackgroundColor="#8E8E93"
              label="Terms of Service"
              onPress={() => openLink('https://unhooked.xyz/terms')}
            />
            <SettingsItem
              icon={<MaterialCommunityIcons name="information-outline" size={22} color="white" />}
              iconBackgroundColor="#5E5CE6"
              label="Version"
              value="1.0.0"
              isLast
            />
          </SettingsGroup>

          {/* Footer */}
          <View className="items-center px-4 pt-4 pb-6">
            <Text className="text-xs text-muted-foreground text-center leading-5">
              Made with care by Teens Aloud Foundation
            </Text>
            <Text className="text-xs text-muted-foreground text-center mt-1">
              © 2025 All rights reserved
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Settings;