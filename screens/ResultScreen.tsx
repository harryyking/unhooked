import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, MotiText } from 'moti';
import { CheckCircle, Shield, Zap, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export default function ResultsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Heavy impact to signify the importance of the results
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* 1. Animated Score Header */}
        <View className="items-center pt-12 px-6">
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 300 }}
            className="w-48 h-48 rounded-full border-4 border-destructive/20 items-center justify-center"
          >
            {/* Inner Glow */}
            <View className="absolute inset-4 rounded-full bg-destructive/10 blur-xl" />
            <Text className="text-muted-foreground text-xs uppercase tracking-[4px]">Status</Text>
            <MotiText 
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 800 }}
              className="text-destructive text-5xl font-black mt-1"
            >
              CRITICAL
            </MotiText>
          </MotiView>

          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 1000 }}
            className="items-center mt-8"
          >
            <Text className="text-foreground text-2xl font-bold text-center">High Dopamine Dependency</Text>
            <Text className="text-muted-foreground text-center mt-3 leading-6 px-4">
              Your neuro-patterns show significant digital fatigue. This is likely affecting your focus and spiritual clarity.
            </Text>
          </MotiView>
        </View>

        {/* 2. Pain Points (Symptoms) */}
        <MotiView 
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1300 }}
          className="mx-6 mt-10 p-6 bg-card border border-border rounded-3xl"
        >
          <View className="flex-row items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-destructive" />
            <Text className="text-foreground text-lg font-bold">Identified Struggles</Text>
          </View>
          
          {['Brain fog & lethargy', 'Spiritual distance', 'Loss of time'].map((s, i) => (
            <View key={s} className="flex-row items-center gap-4 mb-5">
              <CheckCircle size={22} className="text-destructive/60" />
              <Text className="text-card-foreground text-base">{s}</Text>
            </View>
          ))}
        </MotiView>

        {/* 3. The Solution (Personalized Plan) */}
        
        <MotiView 
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1600 }}
          className="mx-6 mt-6 overflow-hidden rounded-3xl"
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            <Text className="text-primary-foreground text-xl font-bold mb-2">The Unhooked Method</Text>
            <Text className="text-primary-foreground/80 mb-6 italic">A science-backed, faith-led path to freedom.</Text>
            
            <View className="gap-4">
              <View className="flex-row items-center gap-4 bg-white/10 p-4 rounded-2xl">
                <Shield size={24} color="white" />
                <View>
                  <Text className="text-white font-bold">Neuro-shielding</Text>
                  <Text className="text-white/70 text-xs">Block triggers before they strike.</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4 bg-white/10 p-4 rounded-2xl">
                <Zap size={24} color="white" />
                <View>
                  <Text className="text-white font-bold">Dopamine Reset</Text>
                  <Text className="text-white/70 text-xs">Rewire your brain for Godly joy.</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* 4. Social Proof / Testimony */}
        <MotiView 
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2000 }}
          className="p-10 items-center"
        >
          <Text className="text-muted-foreground italic text-center text-sm leading-6">
            "I finally feel like myself again. The fog has lifted and my prayer life is thriving."
          </Text>
          <Text className="text-primary font-bold mt-2">— Sarah, 24</Text>
        </MotiView>

      </ScrollView>

      {/* Sticky Action Button */}
      <View className="absolute bottom-0 w-full p-6 bg-background/80">
        <Button 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(paywall)/index');
          }}
          className="h-16 rounded-2xl bg-primary flex-row items-center justify-center gap-3 shadow-xl shadow-primary/20"
        >
          <Text className="text-primary-foreground font-bold text-lg uppercase tracking-widest">Get My Custom Plan</Text>
          <ArrowRight size={20} className="text-primary-foreground" />
        </Button>
      </View>
    </View>
  );
}