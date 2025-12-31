import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text'; // Assuming your UI text component
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase'; // Import your supabase client

// --- iOS Group Component ---
const SettingsGroup = React.memo(
  ({
    title,
    children,
    footerText,
  }: {
    title?: string;
    children: React.ReactNode;
    footerText?: string;
  }) => (
    <View className="mb-8">
      {title && (
        <Text className="px-8 pb-1.5 text-[13px] font-normal uppercase tracking-tight text-muted-foreground">
          {title}
        </Text>
      )}
      <View
        className="mx-4 overflow-hidden rounded-xl bg-card"
        style={
          Platform.OS === 'ios'
            ? { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 }
            : {}
        }>
        {children}
      </View>
      {footerText && (
        <Text className="px-8 pt-2 text-[13px] leading-tight text-muted-foreground">
          {footerText}
        </Text>
      )}
    </View>
  )
);

// --- iOS Item Component ---
const SettingsItem = React.memo(
  ({
    icon,
    iconBackgroundColor,
    label,
    value,
    onPress,
    isSwitch,
    switchValue,
    onSwitchChange,
    isLast,
    isDestructive,
    badge,
  }: any) => {
    const { colorScheme } = useColorScheme();

    const handlePress = () => {
      if (onPress) {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }
    };

    return (
      <View>
        <TouchableOpacity
          activeOpacity={isSwitch ? 1 : 0.7}
          className="min-h-[44px] flex-row items-center bg-card px-4 py-3"
          onPress={handlePress}
          disabled={isSwitch}>
          {icon && (
            <View
              className="mr-3 h-7 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: iconBackgroundColor }}>
              {icon}
            </View>
          )}
          <View className="flex-1 flex-row items-center justify-between">
            <Text className={`text-[17px] ${isDestructive ? 'text-red-500' : 'text-foreground'}`}>
              {label}
            </Text>
            <View className="flex-row items-center gap-2">
              {value && <Text className="text-[17px] text-muted-foreground">{value}</Text>}
              {isSwitch ? (
                <Switch
                  value={switchValue}
                  onValueChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSwitchChange?.(v);
                  }}
                  trackColor={{ false: '#39393D', true: '#34C759' }}
                />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color="#C7C7CC" />
              )}
            </View>
          </View>
        </TouchableOpacity>
        {!isLast && <View className="ml-[56px] h-[0.5px] bg-border/40" />}
      </View>
    );
  }
);

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...user, ...data });
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: 100, // Space for tab bar
        }}>
        <Text className="mb-6 px-8 text-3xl font-bold text-foreground">Settings</Text>

        {/* User Profile Summary */}
        {profile && (
          <View className="mx-4 mb-8 flex-row items-center px-2">
            <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-slate-200">
              <Text className="text-2xl font-bold">{profile.display_name?.[0] || 'U'}</Text>
            </View>
            <View>
              <Text className="text-xl font-semibold">{profile.display_name || 'User'}</Text>
              <Text className="text-muted-foreground">{profile.email}</Text>
            </View>
          </View>
        )}

        <SettingsGroup title="Recovery">
          <SettingsItem
            label="Check-in Reminders"
            icon={<Feather name="bell" color="white" size={18} />}
            iconBackgroundColor="#34C759"
            isSwitch
            switchValue={true}
          />
          <SettingsItem
            label="Privacy Shield"
            icon={<Feather name="shield" color="white" size={18} />}
            iconBackgroundColor="#5856D6"
            isLast
            onPress={() => {}}
          />
        </SettingsGroup>

        <SettingsGroup title="Support">
          <SettingsItem
            label="Help Center"
            icon={<Feather name="help-circle" color="white" size={18} />}
            iconBackgroundColor="#007AFF"
            onPress={() => Linking.openURL('https://unhooked.xyz')}
          />
          <SettingsItem
            label="Share with a Friend"
            icon={<Feather name="share" color="white" size={18} />}
            iconBackgroundColor="#FF9500"
            isLast
            onPress={() => Share.share({ message: 'Check out Unhooked!' })}
          />
        </SettingsGroup>

        <SettingsGroup footerText="Unhooked version 1.0.0 (Build 2025). Built for renewal.">
          <SettingsItem label="Sign Out" isDestructive isLast onPress={handleSignOut} />
        </SettingsGroup>

        <View className="mt-4 items-center">
          <Text className="text-[12px] text-muted-foreground">Teens Aloud Foundation</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
