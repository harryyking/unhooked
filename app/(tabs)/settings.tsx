import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Switch, TouchableOpacity, Linking, Share } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useNavigation } from 'expo-router'; // Assuming you are using Expo Router

// Reusable Component for a single settings item
const SettingsItem = ({
  icon,
  label,
  onPress,
  children,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  isLast = false,
  isLink = false,
}: {
  icon?: React.ReactNode;
  label: string;
  onPress?: () => void;
  children?: React.ReactNode;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isLast?: boolean;
  isLink?: boolean;
}) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? 'white' : 'black';

  return (
    <TouchableOpacity
      className={'flex-row items-center justify-between py-4'}
      onPress={onPress}
      disabled={isSwitch} // Disable press on the row if it's a switch item
    >
      <View className="flex-row items-center flex-1">
        {icon && <View className="w-8 mr-4 items-center justify-center">{icon}</View>}
        <Text className="text-base flex-1" style={{ color: isLink ? '#3b82f6' : iconColor }}>
          {label}
        </Text>
      </View>
      <View>
        {isSwitch ? (
          <Switch value={switchValue} onValueChange={onSwitchChange} />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={24} color={iconColor} />
        )}
      </View>
      {children}
    </TouchableOpacity>
  );
};

const Settings = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation(); // Hook for navigation
  const { colorScheme, setColorScheme } = useColorScheme();

  // State for notifications
  const [allNotifications, setAllNotifications] = useState(true);
  const [newContentNotifications, setNewContentNotifications] = useState(true);
  const [remindersNotifications, setRemindersNotifications] = useState(true);
  const [messagesNotifications, setMessagesNotifications] = useState(true);
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  const toggleAllNotifications = (value: boolean) => {
    setAllNotifications(value);
    setNewContentNotifications(value);
    setRemindersNotifications(value);
    setMessagesNotifications(value);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out Unhooked! The app that helps you disconnect and live better.',
        url: 'https://unhooked.app',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const handleSignOut = () => {
    // Implement sign out logic here
    console.log('Signing out...');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#FF4000', 'rgba(0, 70, 255, 1)']}
        style={{ paddingTop: insets.top }}
      >
        <View className="px-4 py-10">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold mb-1" style={{ color: '#fff' }}>
                Settings
              </Text>
              <Text className="text-muted-foreground text-sm" style={{ color: '#fff' }}>
                Configure and make changes to personal information
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-4">
        {/* Appearance Section */}
        <View className="mt-6 p-4 ">
          <Text className="text-lg font-semibold mb-2">Appearance</Text>
          <SettingsItem
            icon={<MaterialCommunityIcons name="theme-light-dark" size={24} color={isDark ? 'white' : 'black'} />}
            label="Dark Mode"
            isSwitch
            switchValue={isDark}
            onSwitchChange={toggleTheme}
            isLast
          />
        </View>

        {/* Account Management Section */}
        <View className="mt-6 p-4">
          <Text className="text-lg font-semibold mb-2">Account</Text>
          <SettingsItem
            icon={<MaterialCommunityIcons name="account-edit-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="Edit Profile"
            onPress={() => {
              // Navigate to a new screen or open a modal sheet
            
            }}
          />
          <SettingsItem
            icon={<MaterialCommunityIcons name="logout" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="Sign Out"
            onPress={handleSignOut}
            isLast
          />
        </View>

        {/* Notifications Section */}
        <View className="mt-6 p-4 ">
          <Text className="text-lg font-semibold mb-2">Notifications</Text>
          <SettingsItem
            icon={<Feather name="bell" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="All Notifications"
            isSwitch
            switchValue={allNotifications}
            onSwitchChange={toggleAllNotifications}
          />
          <SettingsItem
            icon={<MaterialCommunityIcons name="calendar-clock-outline" size={24} color={allNotifications ? (colorScheme === 'dark' ? 'white' : 'black') : 'gray'} />}
            label="Reminders"
            isSwitch
            switchValue={remindersNotifications}
            onSwitchChange={setRemindersNotifications}
          />
          <SettingsItem
            icon={<MaterialCommunityIcons name="message-text-outline" size={24} color={allNotifications ? (colorScheme === 'dark' ? 'white' : 'black') : 'gray'} />}
            label="Messages"
            isSwitch
            switchValue={messagesNotifications}
            onSwitchChange={setMessagesNotifications}
            isLast
          />
        </View>

        {/* Help & Support Section */}
        <View className="mt-6 p-4">
          <Text className="text-lg font-semibold mb-2 text-black dark:text-white">Help and Support</Text>
          <SettingsItem
            icon={<Feather name="help-circle" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="FAQ"
            onPress={() => openLink('https://unhooked.app/faq')}
          />
          <SettingsItem
            icon={<MaterialCommunityIcons name="email-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="Contact Support"
            onPress={() => openLink('mailto:support@unhooked.app')}
          />
          <SettingsItem
            icon={<Feather name="book" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="User Guide & Tutorials"
            onPress={() => openLink('https://unhooked.app/user-guide')}
            isLast
          />
        </View>

        {/* Share & About Section */}
        <View className="mt-6 p-4">
          <Text className="text-lg font-semibold mb-2 text-black dark:text-white">About & Sharing</Text>
          <SettingsItem
            icon={<MaterialCommunityIcons name="share-variant-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="Share Unhooked"
            onPress={handleShare}
          />
          <SettingsItem
            icon={<MaterialCommunityIcons name="information-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="Privacy Policy"
            onPress={() => openLink('https://unhooked.app/privacy-policy')}
          />
          <SettingsItem
            icon={<MaterialCommunityIcons name="file-document-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />}
            label="Terms of Service"
            onPress={() => openLink('https://unhooked.app/terms-of-service')}
          />
          <View className="mt-4">
            <Text className="text-sm text-gray-500 text-center">App Version: 1.0.0</Text>
            <Text className="text-sm text-gray-500 text-center mt-1">© 2025 Teens Aloud Foundation.</Text>
            <Text className="text-sm text-gray-500 text-center">All rights reserved.</Text>
          </View>
        </View>

        {/* Spacing at the bottom */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
};

export default Settings;