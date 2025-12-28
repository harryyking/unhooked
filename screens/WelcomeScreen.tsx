import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure this is installed
import * as Haptics from 'expo-haptics';
import { MotiView, MotiText } from 'moti';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const VERSES = [
  { 
    text: "I made a covenant with my eyes not to look lustfully at a young woman.", 
    ref: "Job 31:1",
    keyword: "Covenant" 
  },
  { 
    text: "Flee from sexual immorality. Do you not know that your bodies are temples of the Holy Spirit?", 
    ref: "1 Cor 6:18-19",
    keyword: "Temple" 
  },
  { 
    text: "Walk by the Spirit, and you will not gratify the desires of the flesh.", 
    ref: "Gal 5:16",
    keyword: "Spirit" 
  }
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [verseIndex, setVerseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  // Use a ref to control the typing interval manually
  const typingInterval = useRef<NodeJS.Timeout | null>(null);

  // --- Typewriter Logic ---
  useEffect(() => {
    const fullText = VERSES[verseIndex].text;
    setDisplayText(''); // Reset text
    setIsTyping(true);
    let charIndex = 0;

    // Clear any previous interval
    if (typingInterval.current) clearInterval(typingInterval.current);

    typingInterval.current = setInterval(() => {
      setDisplayText((prev) => fullText.slice(0, charIndex + 1));
      charIndex++;

      // Provide very subtle haptic feedback on every few characters for "texture"
      if (charIndex % 5 === 0) Haptics.selectionAsync();

      if (charIndex >= fullText.length) {
        if (typingInterval.current) clearInterval(typingInterval.current);
        setIsTyping(false);
      }
    }, 35); // Slightly faster for better UX

    return () => {
      if (typingInterval.current) clearInterval(typingInterval.current);
    };
  }, [verseIndex]);

  const handleInteraction = useCallback(() => {
    // 1. If typing, FAST FORWARD to end
    if (isTyping) {
      if (typingInterval.current) clearInterval(typingInterval.current);
      setDisplayText(VERSES[verseIndex].text);
      setIsTyping(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } 
    // 2. If done, go to NEXT verse
    else if (verseIndex < VERSES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setVerseIndex(prev => prev + 1);
    } 
    // 3. If finished all verses, NAVIGATE
    else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(auth)/quiz');
    }
  }, [verseIndex, isTyping]);

  return (
    <View className="flex-1 bg-background">
      {/* Background Gradient for Depth */}
      <LinearGradient
        colors={['transparent', 'rgba(74, 222, 128, 0.05)']} // Very subtle primary fade
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <Pressable onPress={handleInteraction} className="flex-1">
        <SafeAreaView className="flex-1 px-8 justify-between">
          
          {/* --- TOP: Progress & Branding --- */}
          <View className="mt-6 flex-row items-center justify-between">
            <MotiView 
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 200 }}
              className="flex-row items-center gap-2"
            >
              <Sparkles size={16} className="text-primary opacity-80" />
              <Text className="text-primary font-black tracking-[4px] uppercase opacity-80">
                Unhooked
              </Text>
            </MotiView>

            {/* Pagination Dots */}
            <View className="flex-row gap-2">
              {VERSES.map((_, i) => (
                <MotiView 
                  key={i} 
                  animate={{ 
                    scale: i === verseIndex ? 1.2 : 1,
                    opacity: i === verseIndex ? 1 : 0.3,
                    backgroundColor: i <= verseIndex ? '#4ADE80' : '#94a3b8' // primary-400 vs slate-400
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
              ))}
            </View>
          </View>

          {/* --- MIDDLE: The Verse --- */}
          <View className="flex-1 justify-center">
             {/* Key changes to remount the animation on new verse */}
            <View className="relative">
              {/* Giant Background Keyword (Visual Texture) */}
              <MotiText
                key={`bg-${verseIndex}`}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.03, scale: 1 }}
                transition={{ type: 'timing', duration: 1000 }}
                className="absolute -top-10 -left-4 text-9xl font-black text-foreground uppercase tracking-tighter"
              >
                {VERSES[verseIndex].keyword}
              </MotiText>

              {/* The Actual Verse */}
              <Text className="text-foreground text-3xl md:text-4xl font-serif font-medium leading-[1.4] tracking-tight">
                “{displayText}”
                {isTyping && <Text className="text-primary animate-pulse">|</Text>}
              </Text>
              
              {/* The Reference (Animates in only when done typing) */}
              {!isTyping && (
                <MotiView 
                  from={{ opacity: 0, translateY: 10 }} 
                  animate={{ opacity: 1, translateY: 0 }}
                  className="mt-8 flex-row items-center"
                >
                  <View className="h-[1px] w-12 bg-primary/50 mr-3" />
                  <Text className="text-primary font-bold text-lg tracking-widest uppercase">
                    {VERSES[verseIndex].ref}
                  </Text>
                </MotiView>
              )}
            </View>
          </View>

          {/* --- BOTTOM: Call to Action --- */}
          <View className="mb-12 h-20 justify-end">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground font-medium text-sm">
                {isTyping ? "Tap to reveal..." : "Tap to continue"}
              </Text>

              {!isTyping && verseIndex === VERSES.length - 1 && (
                <MotiView 
                  from={{ scale: 0, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <Button 
                    onPress={() => router.push('/(auth)/quiz')}
                    size="icon"
                    className="ml-auto rounded-full bg-primary shadow-xl shadow-primary/20"
                  >
                    <ArrowRight size={24} className="text-slate-900" />
                  </Button>
                </MotiView>
              )}
              
              {/* Subtle Arrow for normal progression */}
              {!isTyping && verseIndex < VERSES.length - 1 && (
                <MotiView 
                  from={{ opacity: 0, translateX: -10 }} 
                  animate={{ opacity: 1, translateX: 0 }}
                >
                   <ArrowRight size={20} className="text-muted-foreground opacity-50" />
                </MotiView>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Pressable>
    </View>
  );
}