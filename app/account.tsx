import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useUser } from '@clerk/clerk-expo'; // Clerk user hook

const UserAccount = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoaded } = useUser(); // Get user and loading state
  const [isOnline, setIsOnline] = useState(true);
  
  // Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Network state listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  // Load user data on mount/update
  useEffect(() => {
    if (isLoaded && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.emailAddresses[0]?.emailAddress || '');
    }
  }, [isLoaded, user]);

  const handleSaveProfile = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot save profile changes while offline. Please connect to the internet.');
      return;
    }
  
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
  
    if (!user) {
      Alert.alert('Error', 'User data not available. Please try again.');
      return;
    }
  
    try {
      // Update ONLY name (remove email part)
      const updatedUser = await user.update({
        firstName,
        lastName,
      });
      
      // Optional: Log for debugging
      console.log('Updated user:', updatedUser.firstName, updatedUser.lastName);
      
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Refresh local state with updated data (ensures immediate UI sync)
      setFirstName(updatedUser.firstName || '');
      setLastName(updatedUser.lastName || '');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', `Failed to update profile: ${error || 'Please try again.'}`);
    }
  }, [isOnline, firstName, lastName, user]);


  const handleChangePassword = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot change password while offline. Please connect to the internet.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User data not available. Please try again.');
      return;
    }

    try {
      // Change password with Clerk
      await user.updatePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  }, [isOnline, currentPassword, newPassword, confirmPassword, user]);

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-foreground">User not authenticated</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} className="mt-4">
          <Text className="text-primary">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 bg-background border-b border-border">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <Ionicons name="chevron-back" size={28} color="#007AFF" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-foreground">Account</Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Offline Indicator */}
          {!isOnline && (
            <View className="bg-destructive/10 border border-destructive/20 mx-6 mt-4 p-3 rounded-lg flex-row items-center">
              <Ionicons name="cloud-offline" size={20} color="#ef4444" />
              <Text className="text-destructive text-sm ml-2 flex-1">
                You're offline. Changes cannot be saved.
              </Text>
            </View>
          )}

          {/* Personal Information Section */}
          <View className="px-6 mt-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="person-outline" size={20} color="#007AFF" />
              <Text className="text-lg font-bold text-foreground ml-2">Personal Information</Text>
            </View>

            <View className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted-foreground mb-2">First Name *</Text>
                <Input
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  className="bg-background"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted-foreground mb-2">Last Name *</Text>
                <Input
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  className="bg-background"
                />
              </View>

              <Button
                onPress={handleSaveProfile}
                disabled={!isOnline || !firstName.trim() || !lastName.trim()}
                className="mt-2"
              >
                <Text className="text-primary-foreground text-base font-semibold">
                  Save Profile
                </Text>
              </Button>
            </View>
          </View>

          {/* Password Section */}
          <View className="px-6 mt-8">
            <View className="flex-row items-center mb-4">
              <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
              <Text className="text-lg font-bold text-foreground ml-2">Change Password</Text>
            </View>

            <View className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted-foreground mb-2">Current Password *</Text>
                <View className="relative">
                  <Input
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    className="bg-background pr-12"
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Ionicons 
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted-foreground mb-2">New Password *</Text>
                <View className="relative">
                  <Input
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    className="bg-background pr-12"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  Must be at least 8 characters
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted-foreground mb-2">Confirm New Password *</Text>
                <View className="relative">
                  <Input
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    className="bg-background pr-12"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                onPress={handleChangePassword}
                disabled={!isOnline || !currentPassword || !newPassword || !confirmPassword}
                className="mt-2 bg-secondary"
              >
                <Text className="text-secondary-foreground text-base font-semibold">
                  Update Password
                </Text>
              </Button>
            </View>
          </View>

          {/* Delete Account Section */}
          <View className="px-6 mt-8 mb-4">
            <View className="bg-destructive/5 rounded-2xl p-5 border border-destructive/20">
              <View className="flex-row items-center mb-3">
                <Ionicons name="warning-outline" size={20} color="#ef4444" />
                <Text className="text-base font-bold text-destructive ml-2">Danger Zone</Text>
              </View>
              <Text className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </Text>
              <Button
                onPress={async () => {
                  if (!isOnline) {
                    Alert.alert('Offline', 'Cannot delete account while offline.');
                    return;
                  }
                  Alert.alert(
                    'Delete Account',
                    'Are you sure you want to delete your account? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            // Delete account with Clerk
                            await user?.delete();
                            Alert.alert('Success', 'Account deleted successfully.');
                            router.replace('/(auth)/sign-in');
                          } catch (error) {
                            console.error('Error deleting account:', error);
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                          }
                        }
                      }
                    ]
                  );
                }}
                className="bg-destructive"
              >
                <Text className="text-white text-base font-semibold">
                  Delete Account
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default UserAccount;