import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { Shield, Zap, Star, Lock, Check, X, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const PLANS = [
  {
    id: 'weekly_pro',
    name: 'Weekly',
    price: '$4.99',
    description: 'Billed weekly',
    tag: null,
  },
  {
    id: 'yearly_pro',
    name: 'Annual',
    price: '$39.99',
    description: 'Just $3.33/mo',
    tag: 'BEST VALUE',
    savings: '80%',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('yearly_pro');
  const [showClose, setShowClose] = useState(false);

  // Close button cooldown (from your Swift logic)
  useEffect(() => {
    const timer = setTimeout(() => setShowClose(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePurchase = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Integrate RevenueCat or StoreKit here
    router.replace('/(tabs)/home');
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Ambient Glow */}
      <View className="absolute top-[-100] left-[-50] w-[300] h-[300] bg-primary/10 rounded-full blur-3xl" />

      <SafeAreaView className="flex-1">
        {/* Header with Cooldown Close */}
        <View className="flex-row justify-between items-center px-6 py-2">
          <View className="flex-row items-center gap-2">
            <Crown size={18} className="text-primary" />
            <Text className="text-primary font-bold tracking-widest text-xs uppercase">Unhooked Pro</Text>
          </View>
          
          <AnimatePresence>
            {showClose && (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                  <X size={24} className="text-muted-foreground" />
                </TouchableOpacity>
              </MotiView>
            )}
          </AnimatePresence>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Hero Section: The "Shaking" Crown/Icon */}
          <View className="items-center py-8">
            <MotiView
              from={{ scale: 0.9, rotate: '0deg' }}
              animate={{ 
                scale: [
                  { value: 1.1, type: 'timing', duration: 1000 },
                  { value: 1, type: 'timing', duration: 1000 }
                ],
                rotate: ['-3deg', '3deg', '-3deg']
              }}
              transition={{ 
                loop: true,
                type: 'timing',
                duration: 2000 
              }}
              className="w-24 h-24 bg-primary/20 rounded-3xl items-center justify-center border border-primary/30"
            >
              <Crown size={48} className="text-primary" />
            </MotiView>
            
            <Text className="text-foreground text-3xl font-black mt-6 text-center px-10">
              Break the Cycle.{"\n"}Forever.
            </Text>
          </View>

          {/* Features List */}
          <View className="px-8 gap-y-5 mb-10">
            <FeatureRow icon={<Zap size={20} />} title="Neuro-shield AI blocking" subtitle="Blocks triggers across all apps." />
            <FeatureRow icon={<Shield size={20} />} title="Deep Prayer integration" subtitle="Spiritual anchors for weak moments." />
            <FeatureRow icon={<Star size={20} />} title="Advanced recovery metrics" subtitle="See your brain re-wiring in real-time." />
          </View>

          {/* Pricing Cards */}
          <View className="px-6 gap-y-4">
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedPlan(plan.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`p-5 rounded-3xl border-2 flex-row items-center justify-between ${
                  selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selectedPlan === plan.id ? 'border-primary bg-primary' : 'border-muted'
                  }`}>
                    {selectedPlan === plan.id && <Check size={14} color="black" strokeWidth={4} />}
                  </View>
                  <View>
                    <Text className="text-foreground font-bold text-lg">{plan.name}</Text>
                    <Text className="text-muted-foreground text-sm">{plan.description}</Text>
                  </View>
                </View>
                
                <View className="items-end">
                  <Text className="text-foreground font-black text-xl">{plan.price}</Text>
                  {plan.tag && (
                    <View className="bg-primary px-2 py-1 rounded-md mt-1">
                      <Text className="text-[10px] font-bold text-primary-foreground">{plan.tag}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trust Labels */}
          <View className="mt-8 items-center gap-2">
            <View className="flex-row items-center gap-2">
              <Lock size={12} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                Secure payment via App Store
              </Text>
            </View>
            <TouchableOpacity onPress={() => {/* Restore Logic */}}>
              <Text className="text-primary/60 text-xs font-medium underline">Restore Purchase</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View className="px-6 pb-4">
          <Button 
            onPress={handlePurchase}
            className="h-16 rounded-2xl bg-primary"
          >
            <Text className="text-primary-foreground font-black text-lg">START MY TRANSFORMATION</Text>
          </Button>
          <Text className="text-muted-foreground text-[10px] text-center mt-4 px-6 leading-4">
            Subscription auto-renews. Cancel anytime in App Store settings. By continuing, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Sub-component for clean code
function FeatureRow({ icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
  return (
    <View className="flex-row items-start gap-4">
      <View className="mt-1 text-primary">{icon}</View>
      <View>
        <Text className="text-foreground font-bold text-base leading-5">{title}</Text>
        <Text className="text-muted-foreground text-sm leading-5 mt-0.5">{subtitle}</Text>
      </View>
    </View>
  );
}