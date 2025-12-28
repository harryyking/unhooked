import React, { useState, useRef } from 'react';
import { View, Dimensions, FlatList, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import { ArrowRight, Brain, ShieldAlert, Sparkles, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'diagnosis',
    status: 'CRITICAL',
    title: 'High Dopamine Dependency',
    subtitle: 'Your assessment shows significant digital fatigue affecting your focus.',
    gradient: ['#450a0a', '#020617'], // Dark Red
    icon: <Brain size={60} color="#ef4444" />,
  },
  {
    id: 'symptoms',
    status: 'ANALYSIS',
    title: 'Identified Struggles',
    subtitle: 'Brain fog, spiritual distance, and loss of intentional time were detected.',
    gradient: ['#1e1b4b', '#020617'], // Dark Blue
    icon: <ShieldAlert size={60} color="#6366f1" />,
  },
  {
    id: 'solution',
    status: 'THE CURE',
    title: 'The Unhooked Method',
    subtitle: 'A science-backed protocol to rewire your brain for Godly joy.',
    gradient: ['#064e3b', '#020617'], // Dark Green
    icon: <Sparkles size={60} color="#10b981" />,
  }
];

export default function ResultsSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(auth)/features');
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Dynamic Background Gradient */}
      <AnimatePresence>
        <MotiView
          key={SLIDES[activeIndex].id}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        >
  
        </MotiView>
      </AnimatePresence>

      <SafeAreaView className="flex-1">
        {/* Progress Dots */}
        <View className="flex-row justify-center gap-2 mt-4">
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              className={`h-1 rounded-full ${i === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} 
            />
          ))}
        </View>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width }} className="px-10 justify-center items-center">
              <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 200 }}
      
                className="w-40 h-40 rounded-full bg-white/5 border text-foreground border-white/10 items-center justify-center mb-10"
              >
                {item.icon}
              </MotiView>

              <MotiText 
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400 }}
                className="text-white/50 tracking-[4px] uppercase text-xs"
              >
                {item.status}
              </MotiText>

              <MotiText 
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500 }}
                className=" text-4xl font-bold text-center mt-2"
              >
                {item.title}
              </MotiText>

              <MotiText 
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 600 }}
                className=" text-center mt-4 text-lg leading-7"
              >
                {item.subtitle}
              </MotiText>
            </View>
          )}
        />

        {/* Footer Action */}
        <View className="px-8 pb-10">
          <Button 
            onPress={handleNext}
            className="h-16 rounded-2xl bg-white flex-row items-center justify-center gap-3"
          >
            <Text className="text-sm uppercase tracking-widest">
              {activeIndex === SLIDES.length - 1 ? "Start My Journey" : "Continue"}
            </Text>
            <ArrowRight size={20} color="#020617" />
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}