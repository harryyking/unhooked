import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti'; // For smooth transitions

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const VERSES = [
  { text: "I made a covenant with my eyes not to look lustfully at a young woman.", ref: "Job 31:1" },
  { text: " Flee from sexual immorality. All other sins a person commits are outside the body, but whoever sins sexually, sins against their own body. 19 Do you not know that your bodies are temples of the Holy Spirit, who is in you, whom you have received from God? You are not your own", ref: "1 Cor 6:18-19" },
  { text: "Walk by the Spirit, and you will not gratify the desires of the flesh.", ref: "Gal 5:16" }
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [verseIndex, setVerseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // --- Typewriter Logic ---
  useEffect(() => {
    let i = 0;
    setDisplayText('');
    setIsTyping(true);
    const fullText = VERSES[verseIndex].text;

    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [verseIndex]);

  const handleNextVerse = useCallback(() => {
    if (isTyping) {
      setDisplayText(VERSES[verseIndex].text);
      setIsTyping(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (verseIndex < VERSES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setVerseIndex(prev => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(auth)/quiz');
    }
  }, [verseIndex, isTyping]);

  return (
    <Pressable onPress={handleNextVerse} className="flex-1 bg-background">
      <LinearGradient
        colors={['#020617', '#0f172a', '#020617']}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1 px-10 justify-between">
        {/* Top Branding */}
        <MotiView 
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
          className="mt-8"
        >
          <Text className="text-primary text-xs font-bold tracking-[5px] uppercase opacity-70">
            Unhooked
          </Text>
        </MotiView>

        {/* Center Verse Section with Fade Transition */}
        <View className="min-h-[350px] justify-center">
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={verseIndex} // Key change triggers the transition
              from={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Text className="text-foreground text-3xl font-medium leading-[46px] tracking-tight italic">
                "{displayText}"
                {isTyping && <View className="w-1.5 h-7 bg-primary ml-1" />}
              </Text>
              
              {!isTyping && (
                <MotiView 
                  from={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="mt-8 flex-row items-center"
                >
                  <View className="h-[2px] w-6 bg-primary/40 mr-3" />
                  <Text className="text-primary font-bold text-xl">
                    {VERSES[verseIndex].ref}
                  </Text>
                </MotiView>
              )}
            </MotiView>
          </AnimatePresence>
        </View>

        {/* Bottom UI */}
        <View className="mb-12">
          {/* Custom Progress Bar */}
          <View className="flex-row gap-3 mb-10 items-center">
            {VERSES.map((_, i) => (
              <MotiView 
                key={i} 
                animate={{ 
                  width: i === verseIndex ? 32 : 12,
                  backgroundColor: i === verseIndex ? '#4ADE80' : '#334155' 
                }}
                className="h-1.5 rounded-full" 
              />
            ))}
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground font-medium text-sm">
              {isTyping ? "Focusing..." : "Tap to continue"}
            </Text>
            
            {!isTyping && verseIndex === VERSES.length - 1 && (
              <MotiView from={{ scale: 0 }} animate={{ scale: 1 }}>
                <Button 
                  onPress={() => router.push('/(auth)/quiz')}
                  size="icon"
                  className="rounded-full bg-primary h-14 w-14 shadow-lg shadow-primary/20"
                >
                  <ArrowRight size={24} className="text-background" />
                </Button>
              </MotiView>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Pressable>
  );
}