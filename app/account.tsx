import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/clerk-expo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const UserAccount = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useClerk();
  const [isOnline, setIsOnline] = useState(true);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');

  // Network state listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  const handleSave = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot save profile changes while offline. Please connect to the internet.');
      return;
    }

    try {
      await user?.update({ firstName, lastName });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  }, [isOnline, user, firstName, lastName]);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View className="px-4 py-6 bg-background flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Edit Profile</Text>
          <View className="w-6" />
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="bg-card rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-2">First Name</Text>
            <Input
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              className="mb-4"
            />
            <Text className="text-base font-semibold text-foreground mb-2">Last Name</Text>
            <Input
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              className="mb-4"
            />
            <Text className="text-base font-semibold text-foreground mb-2">Email</Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              editable={false}
              className="mb-4"
            />
            <Button
              onPress={handleSave}
              disabled={!isOnline || !firstName.trim()}
            >
              <Text className="text-primary-foreground text-base font-semibold">Save Changes</Text>
            </Button>
          </View>
          {!isOnline && (
            <Text className="text-destructive text-center text-sm mt-2">
              Offline Mode - Profile changes cannot be saved
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default UserAccount;