import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Switch, TouchableOpacity, Linking, Share } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useNavigation } from 'expo-router';

// iOS-style settings group component
const SettingsGroup = ({ 
  title, 
  children, 
  footerText 
}: { 
  title?: string; 
  children: React.ReactNode;
  footerText?: string;
}) => {
  return (
    <View className="mb-8">
      {title && (
        <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-4 pb-2">
          {title}
        </Text>
      )}
      <View className="bg-secondary mx-4 rounded-xl overflow-hidden">
        {children}
      </View>
      {footerText && (
        <Text className="text-xs text-muted-foreground px-4 pt-2 leading-4">
          {footerText}
        </Text>
      )}
    </View>
  );
};

// iOS-style settings item component
const SettingsItem = ({
  icon,
  iconColor,
  iconBackgroundColor,
  label,
  value,
  onPress,
  children,
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
  children?: React.ReactNode;
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
            className={`text-base ${isDestructive ? 'text-red-500' : 'text-foreground'} ${isLink ? 'text-blue-500' : ''}`}
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
                thumbColor={'#ffffff'}
              />
            ) : onPress && (
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color={colorScheme === 'dark' ? '#8E8E93' : '#C7C7CC'} 
              />
            )}
          </View>
        </View>
        {children}
      </TouchableOpacity>
      
      {!isLast && (
        <View 
          className="h-px bg-border ml-12" 
          style={{ marginLeft: icon ? 48 : 16 }}
        />
      )}
    </View>
  );
};

const Settings = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-4 py-6 bg-background">
          <Text className="text-2xl font-bold mb-1">Settings</Text>
          <Text className="text-muted-foreground text-base">
            Manage your preferences and account
          </Text>
        </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Account Section */}
          <SettingsGroup title="Account">
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="account-circle-outline" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#007AFF"
              label="Edit Profile"
              onPress={() => {
                // Navigate to profile editing
              }}
            />
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="logout" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#FF3B30"
              label="Sign Out"
              onPress={handleSignOut}
              isLast
              isDestructive
            />
          </SettingsGroup>

          {/* Preferences Section */}
          <SettingsGroup 
            title="Preferences"
            footerText="Dark mode reduces eye strain in low-light conditions and may help save battery life on OLED displays."
          >
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name={isDark ? "weather-night" : "weather-sunny"} 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor={isDark ? "#5856D6" : "#FF9500"}
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
            footerText="Control which notifications you receive to stay focused while using Unhooked."
          >
            <SettingsItem
              icon={
                <Feather 
                  name="bell" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#FF3B30"
              label="Allow Notifications"
              isSwitch
              switchValue={allNotifications}
              onSwitchChange={toggleAllNotifications}
            />
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="calendar-clock" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#34C759"
              label="Reminders"
              isSwitch
              switchValue={remindersNotifications && allNotifications}
              onSwitchChange={setRemindersNotifications}
            />
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="message-text" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#007AFF"
              label="Messages"
              isSwitch
              switchValue={messagesNotifications && allNotifications}
              onSwitchChange={setMessagesNotifications}
              isLast
            />
          </SettingsGroup>

          {/* Help & Support Section */}
          <SettingsGroup title="Help & Support">
            <SettingsItem
              icon={
                <Feather 
                  name="help-circle" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#5856D6"
              label="FAQ"
              onPress={() => openLink('https://unhooked.app/faq')}
            />
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="email-outline" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#FF9500"
              label="Contact Support"
              onPress={() => openLink('mailto:support@unhooked.app')}
            />
            <SettingsItem
              icon={
                <Feather 
                  name="book" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#32D74B"
              label="User Guide"
              onPress={() => openLink('https://unhooked.app/user-guide')}
              isLast
            />
          </SettingsGroup>

          {/* About Section */}
          <SettingsGroup title="About">
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="share-variant" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#007AFF"
              label="Share Unhooked"
              onPress={handleShare}
            />
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="shield-check" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#34C759"
              label="Privacy Policy"
              onPress={() => openLink('https://unhooked.app/privacy-policy')}
            />
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="file-document" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#8E8E93"
              label="Terms of Service"
              onPress={() => openLink('https://unhooked.app/terms-of-service')}
            />
            <SettingsItem
              icon={
                <MaterialCommunityIcons 
                  name="information" 
                  size={20} 
                  color="white" 
                />
              }
              iconBackgroundColor="#5856D6"
              label="App Version"
              value="1.0.0"
              isLast
            />
          </SettingsGroup>

          {/* Footer */}
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