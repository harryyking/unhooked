import { StyleSheet, View, Modal, TouchableOpacity, FlatList, Clipboard, Share, KeyboardAvoidingView, Dimensions, Platform, ActivityIndicator, Alert, Animated } from 'react-native';
import React, { JSX, useState, useRef, useEffect } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from './ui/card';
import { Text } from './ui/text';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useQuery, useMutation, Unauthenticated, Authenticated, useConvexAuth } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const MemberCard: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Redeem modal states
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Animation refs for redeem modal
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Auth state
  const {isAuthenticated, isLoading } = useConvexAuth();
  const partnershipUsers = useQuery(api.invite.getPartnershipUsersWithStreaks, isAuthenticated ? undefined : "skip") || [];
  const generateInviteMutation = useMutation(api.invite.generateInvite);
  const redeemInvite = useMutation(api.invite.redeemInvite);

  // Reset redeem modal state when opening
  useEffect(() => {
    if (redeemModalVisible) {
      setCode("");
      setError("");
      setSuccess(false);
      setIsSubmitting(false);
      
      // Reset animations
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      scaleAnim.setValue(0.8);
      
      // Initial entrance animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [redeemModalVisible]);

  // Close modals if user signs out
  useEffect(() => {
    if (!isAuthenticated && (modalVisible || redeemModalVisible)) {
      setModalVisible(false);
      setRedeemModalVisible(false);
      Alert.alert("Session Expired", "Please sign in to continue.");
    }
  }, [isAuthenticated]);

  const handleGenerateInvite = async (): Promise<void> => {
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to generate an invite code.");
      return;
    }
    
    try {
      const result = await generateInviteMutation();
      setInviteCode(code);
      setIsCopied(false);
    } catch (error: any) {
      console.error('Error generating invite:', error);
      Alert.alert("Error", "Failed to generate invite code. Please try again.");
    }
  };

  const handleCopyCode = (): void => {
    if (inviteCode) {
      Clipboard.setString(inviteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShareCode = async (): Promise<void> => {
    if (inviteCode) {
      try {
        await Share.share({
          message: `Join me on Unhooked! Use my invite code to become my partner: ${inviteCode}\n\nDownload the app here: [Your App Store Link]`,
        });
      } catch (error) {
        console.error('Error sharing invite:', error);
        Alert.alert("Error", "Failed to share invite code.");
      }
    }
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to redeem an invite code.");
      setRedeemModalVisible(false);
      return;
    }

    if (code.trim().length === 0) {
      setError("Please enter an invite code.");
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await redeemInvite({ code: code.toUpperCase() });
      
      // Success animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSuccess(true);
        fadeAnim.setValue(1);
        scaleAnim.setValue(0.8);
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to redeem invite code. Please try again.";
      setError(errorMessage);
      Alert.alert("Redemption Failed", errorMessage);
      
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCode = (text: string) => {
    return text.toUpperCase().replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCodeChange = (text: string) => {
    const cleanText = text.replace(/\s/g, '').toUpperCase();
    if (cleanText.length <= 8) {
      setCode(cleanText);
      setError("");
    }
  };

  const renderPartnershipUser = ({ item }: { item: { username: string; currentStreak: number } }): JSX.Element => (
    <View className="flex-row justify-between items-center py-3 border-b border-border">
      <Text className="text-base font-medium">{item.username}</Text>
      <Text className="text-sm text-muted-foreground">Streak: {item.currentStreak}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View className='mt-6'>
      <Card className='rounded-lg bg-secondary'>
        <CardHeader>
          <CardTitle>
            <Text className='text-lg font-bold'>Surround Yourself</Text>
          </CardTitle>
          <CardDescription>
            <Text variant={'p'}>Create an accountability group to track your activity and keep you motivated</Text>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-row gap-2">
          <Button size={"sm"} className='rounded-full flex-1' onPress={() => setModalVisible(true)}>
            <Text>Find friends</Text>
          </Button>
          <Button size={"sm"} variant="outline" className='rounded-full flex-1' onPress={() => setRedeemModalVisible(true)}>
            <Text>Join partner</Text>
          </Button>
        </CardFooter>
      </Card>

      {/* Partners list */}
      <View className="mt-5 px-4">
        <Text className="text-lg font-bold mb-3">Your Partners</Text>
        {partnershipUsers.length > 0 ? (
          <FlatList
            data={partnershipUsers}
            renderItem={renderPartnershipUser}
            keyExtractor={(item, index) => index.toString()}
            className="flex-grow-0"
          />
        ) : (
          <Text className="text-muted-foreground italic text-center mt-3">
            No partners yet. Invite some friends to get started!
          </Text>
        )}
      </View>

      {/* Generate Invite Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle='pageSheet'
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View className="items-center pt-3 px-5 pb-2">
            <View className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-3" />
          </View>

          <KeyboardAvoidingView
            className="flex-1 px-6 py-8"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="people" size={28} className="text-primary" />
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2">Invite Friends</Text>
              <Text className="text-base text-muted-foreground text-center leading-6">
                Share your unique invite code to add accountability partners
              </Text>
            </View>

            <Button 
              onPress={handleGenerateInvite} 
              className='mb-4'
              disabled={!isAuthenticated || isLoading}
            >
              <View className="flex-row items-center">
                <Ionicons name="add-circle-outline" size={20} className="text-primary-foreground mr-2" />
                <Text className="text-primary-foreground font-semibold">Generate Invite Code</Text>
              </View>
            </Button>

            <Unauthenticated>
              <View className="flex-row items-center bg-destructive/10 p-4 rounded-lg mb-6 border-l-4 border-destructive">
                <Ionicons name="warning" size={20} className="text-destructive mr-3" />
                <Text className="text-destructive text-sm flex-1">
                  You must be signed in to generate an invite code.
                </Text>
              </View>
            </Unauthenticated>

            <Authenticated>
              {inviteCode && (
                <View className="flex-1">
                  <View className="bg-muted/30 border-2 border-dashed border-border rounded-2xl py-8 px-5 mb-6">
                    <Text className="text-3xl font-bold text-center tracking-wider font-mono">
                      {inviteCode}
                    </Text>
                  </View>

                  <View className="flex-row gap-3 mb-6">
                    <Button 
                      variant="outline" 
                      onPress={handleCopyCode} 
                      className={`flex-1 ${isCopied ? 'bg-green-50 border-green-200' : ''}`}
                    >
                      <View className="flex-row items-center">
                        <Ionicons 
                          name={isCopied ? "checkmark" : "copy-outline"} 
                          size={18} 
                          className={isCopied ? "text-green-600 mr-2" : "text-white mr-2"} 
                        />
                        <Text className={isCopied ? "text-green-600 font-medium" : "font-medium"}>
                          {isCopied ? "Copied!" : "Copy Code"}
                        </Text>
                      </View>
                    </Button>

                    <Button 
                      onPress={handleShareCode} 
                      className="flex-1"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="share-outline" size={18} className="text-primary-foreground mr-2" />
                        <Text className="text-primary-foreground font-medium">Share Code</Text>
                      </View>
                    </Button>
                  </View>

                  <View className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                    <Text className="text-sm text-muted-foreground text-center leading-5">
                      Share this code with friends so they can join as your accountability partners. 
                      They'll need to enter this code when signing up.
                    </Text>
                  </View>
                </View>
              )}
            </Authenticated>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Redeem Invite Modal */}
      <Modal
        visible={redeemModalVisible}
        animationType="slide"
        presentationStyle='pageSheet'
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View className="items-center pt-3 px-5 pb-2">
            <View className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-3" />
          </View>

          <KeyboardAvoidingView
            className="flex-1 px-6 py-8"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {success ? (
              // Success Screen
              <Animated.View
                style={{
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })},
                  ],
                  opacity: fadeAnim,
                }}
                className="flex-1 justify-center"
              >
                <View className="items-center mb-8">
                  <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                    <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                  </View>
                  
                  <Text className="text-2xl font-bold text-center mb-3">
                    🎉 Congratulations!
                  </Text>
                  
                  <Text className="text-center text-muted-foreground text-lg mb-6 leading-relaxed">
                    You now have an accountability partner. Together, you'll support each other on this journey.
                  </Text>

                  <View className="w-full bg-green-50 p-4 rounded-xl mb-6">
                    <View className="flex-row items-center justify-center mb-2">
                      <Ionicons name="people" size={24} color="#10b981" />
                      <Text className="ml-2 font-semibold text-green-800">
                        Partnership Active
                      </Text>
                    </View>
                    <Text className="text-center text-green-700 text-sm">
                      You can now share your progress and encourage each other
                    </Text>
                  </View>

                  <Button 
                    size="lg" 
                    className="w-full"
                    onPress={() => setRedeemModalVisible(false)}
                  >
                    <Text className="font-semibold">Continue</Text>
                  </Button>
                </View>
              </Animated.View>
            ) : (
              // Redeem Form
              <Animated.View
                style={{
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })},
                  ],
                  opacity: fadeAnim,
                }}
                className="flex-1"
              >
                <View className="items-center mb-8">
                  <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                    <Ionicons name="link" size={32} className="text-primary" />
                  </View>
                  <Text className="text-2xl font-bold text-foreground mb-2">
                    Join Partner
                  </Text>
                  <Text className="text-center text-muted-foreground text-base leading-relaxed">
                    Enter the code from your accountability partner to connect and start supporting each other.
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-foreground mb-3">
                    Invite Code
                  </Text>
                  
                  <View className="relative">
                    <Input
                      placeholder="ABCD EFGH"
                      placeholderTextColor="#9ca3af"
                      value={formatCode(code)}
                      onChangeText={handleCodeChange}
                      maxLength={11}
                      autoCapitalize="characters"
                      editable={!isSubmitting}
                      className={`text-center font-mono tracking-widest ${
                        error ? 'border-red-300 bg-red-50' : 'border-border bg-muted/30'
                      }`}
                      autoCorrect={false}
                      autoComplete="off"
                    />
                    
                    {code.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setCode("")}
                        className="absolute right-3 top-1/2 -mt-3 w-6 h-6 bg-muted rounded-full items-center justify-center"
                      >
                        <Ionicons name="close" size={14} className="text-muted-foreground" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="flex-row justify-center space-x-1 mt-3">
                    {[...Array(8)].map((_, index) => (
                      <View
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index < code.length ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </View>

                  <Text className="text-xs text-center text-muted-foreground mt-2">
                    {8 - code.length} characters remaining
                  </Text>
                </View>

                {error ? (
                  <View className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6">
                    <View className="flex-row items-center">
                      <Ionicons name="alert-circle" size={16} className="text-destructive" />
                      <Text className="ml-2 text-destructive text-sm font-medium">
                        {error}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <Button
                  size="lg"
                  onPress={handleRedeem}
                  disabled={isSubmitting || code.length < 8 || !isAuthenticated || isLoading}
                  className="w-full mb-4"
                >
                  {isSubmitting ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="ml-2 font-semibold text-primary-foreground">
                        Connecting...
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Ionicons name="link" size={18} className="text-primary-foreground" />
                      <Text className="ml-2 font-semibold text-primary-foreground">
                        Connect Partner
                      </Text>
                    </View>
                  )}
                </Button>
              </Animated.View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default MemberCard;