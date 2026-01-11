import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Switched to Ionicons for Apple look
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const SettingsGroup = ({ title, children, footerText }: any) => (
  <View style={styles.groupContainer}>
    {title && <Text style={styles.groupTitle}>{title}</Text>}
    <View style={styles.groupCard}>{children}</View>
    {footerText && <Text style={styles.groupFooter}>{footerText}</Text>}
  </View>
);

const SettingsItem = ({ icon, iconBg, label, value, onPress, isSwitch, switchValue, onSwitchChange, isLast, isDestructive }: any) => (
  <View>
    <TouchableOpacity
      activeOpacity={isSwitch ? 1 : 0.6}
      style={styles.itemTouch}
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={[styles.iconEnclosure, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, isDestructive && styles.destructiveText]}>
          {label}
        </Text>
        <View style={styles.itemRight}>
          {value && <Text style={styles.itemValue}>{value}</Text>}
          {isSwitch ? (
            <Switch
              value={switchValue}
              onValueChange={onSwitchChange}
              trackColor={{ false: '#334155', true: '#34C759' }}
              ios_backgroundColor="#334155"
            />
          ) : (
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          )}
        </View>
      </View>
    </TouchableOpacity>
    {!isLast && <View style={styles.separator} />}
  </View>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...user, ...data });
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
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
    <View style={styles.container}>
   

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top + 20 } // Proper spacing for notched iPhones
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fixed Header Alignment */}
        <View style={styles.header}>
          <Text variant={'h2'}>Settings</Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => Haptics.selectionAsync()}
          style={styles.profileWrapper}
        >
          <BlurView intensity={30} tint="dark" style={styles.profileCard}>
            <View style={styles.avatarEnclosure}>
              <Text style={styles.avatarText}>
                {profile?.display_name?.[0] || profile?.email?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.display_name || 'Set up Profile'}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{profile?.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </BlurView>
        </TouchableOpacity>

        <SettingsGroup title="App Settings">
          <SettingsItem 
            label="Daily Check-in" 
            icon={<Ionicons name="calendar" color="white" size={18} />} 
            iconBg="#5856D6" 
            value="8:00 AM"
          />
          <SettingsItem 
            label="Push Notifications" 
            icon={<Ionicons name="notifications" color="white" size={18} />} 
            iconBg="#FF9500" 
            isSwitch
            switchValue={true}
          />
          <SettingsItem 
            label="Privacy Lock" 
            icon={<Ionicons name="shield-checkmark" color="white" size={18} />} 
            iconBg="#34C759" 
            isLast
          />
        </SettingsGroup>

        <SettingsGroup title="Support">
          <SettingsItem 
            label="Unhooked Guide" 
            icon={<Ionicons name="book" color="white" size={18} />} 
            iconBg="#007AFF" 
          />
          <SettingsItem 
            label="Send Feedback" 
            icon={<Ionicons name="mail" color="white" size={18} />} 
            iconBg="#AF52DE" 
            isLast
          />
        </SettingsGroup>

        <SettingsGroup footerText="Unhooked version 1.0.0">
          <SettingsItem 
            label="Sign Out" 
            isDestructive 
            isLast 
            onPress={handleSignOut} 
          />
        </SettingsGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: width * 1.2,
    height: 400,
    backgroundColor: '#6366f1',
    opacity: 0.06,
    borderRadius: 200,
  },
  scrollContent: {
    paddingBottom: 140, // Space for the floating tab bar
  },
  header: {
    paddingHorizontal: 24, // Aligns with the card edges
    marginBottom: 20,
  },
  headerText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -1,
  },
  profileWrapper: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  profileCard: {
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  avatarEnclosure: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 2,
  },
  groupContainer: {
    marginBottom: 28,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 32,
    marginBottom: 8,
  },
  groupCard: {
    marginHorizontal: 16,
    backgroundColor: '#0F172A',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  groupFooter: {
    fontSize: 13,
    color: '#475569',
    marginHorizontal: 32,
    marginTop: 8,
    lineHeight: 18,
  },
  itemTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconEnclosure: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 14,
  },
  itemLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F1F5F9',
  },
  destructiveText: {
    color: '#FF453A',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 60,
  },
});