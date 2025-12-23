import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';

// --- UI Components & Store ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

const QUESTIONS = [
  "Do you often check your phone immediately after waking up?",
  "Have you ever tried to stop but failed within a few days?",
  "Do you feel anxious when you cannot access your device?",
  "Does your screen time interfere with your sleep or work?",
  "Do you use your phone to escape from real-life problems?"
];

const OPTIONS = [
  { label: 'Never', value: 1 },
  { label: 'Rarely', value: 2 },
  { label: 'Sometimes', value: 3 },
  { label: 'Often', value: 4 },
  { label: 'Always', value: 5 },
];

export default function QuizScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const setScore = useAppStore((state) => state.setQuizScore);

  const handleAnswer = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScore((prev: number) => prev + value);
    
    if (index < QUESTIONS.length - 1) {
      setIndex(index + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(auth)/results');
    }
  };

  const progress = ((index + 1) / QUESTIONS.length) * 100;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 px-6">
        
        {/* 1. Header & Progress */}
        <View className="mt-4 mb-10">
          <View className="flex-row justify-between items-end mb-4">
            <View>
              <Text className="text-primary font-bold text-xs uppercase tracking-widest">Assessment</Text>
              <Text className="text-foreground text-2xl font-bold mt-1">Honest Check-in</Text>
            </View>
            <Text className="text-muted-foreground font-medium text-sm">
              {index + 1} <Text className="opacity-50">/ {QUESTIONS.length}</Text>
            </Text>
          </View>
          
          {/* Animated Progress Bar */}
          <View className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <MotiView
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 15 }}
              className="h-full bg-primary"
            />
          </View>
        </View>

        {/* 2. Question Card Area */}
        <View className="flex-1">
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
              className="min-h-[160px] justify-center"
            >
              <Text className="text-foreground text-3xl font-semibold leading-tight tracking-tight">
                {QUESTIONS[index]}
              </Text>
            </MotiView>
          </AnimatePresence>

          {/* 3. Options List */}
          <View className="mt-10 gap-3">
            {OPTIONS.map((option, i) => (
              <MotiView
                key={option.label}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: i * 50 }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleAnswer(option.value)}
                  className="bg-card border border-border p-5 rounded-2xl flex-row justify-between items-center active:bg-primary/5 active:border-primary/40"
                >
                  <Text className="text-card-foreground text-lg font-medium">{option.label}</Text>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </View>

        {/* 4. Footer Warning (Trust Building) */}
        <View className="py-6">
          <Text className="text-muted-foreground text-center text-xs px-10 leading-5">
            Your answers are private and encrypted. This assessment helps customize your recovery path.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}