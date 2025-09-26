// components/PrayerTimerCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/button'; // Assuming shadcn-like reusable
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Card } from './ui/card';
import { ChevronRight } from 'lucide-react-native'; // Assuming lucide icons for React Native are available; install if needed

interface PrayerTimerCardProps {
  dailyVerse: string; // e.g., "1 Corinthians 10:13"
  onPress?: () => void;
}

export function PrayerTimerCard({ dailyVerse, onPress }: PrayerTimerCardProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to prayer session screen with verse as query param
      router.push(`/prayer-session?verse=${encodeURIComponent(dailyVerse)}`);
    }
  };

  return (
    <Card className="bg-secondary rounded-3xl shadow-md overflow-hidden">
      <View className="p-4">
        <Text
          className="text-lg font-semibold text-center mb-2"
          style={{ color: colors.text }}
        >
          Guided Prayer (3 min)
        </Text>
        <Button
          onPress={handlePress}
          className="rounded-full py-3"
        >
          <Text className="font-medium mr-2">Start Prayer</Text>
          <ChevronRight size={18} color="white" />
        </Button>
      </View>
    </Card>
  );
}