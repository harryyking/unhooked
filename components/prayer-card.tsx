// components/PrayerTimerCard.tsx
import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';

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
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className="rounded-3xl overflow-hidden shadow-md mb-6"
    >
      <ImageBackground
        source={require('@/assets/images/prayer.jpg')} // Replace with your image path
        className="w-full h-40"
        resizeMode="cover"
      >
        {/* Gradient overlay for better text readability */}
        <View className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-white text-2xl font-bold text-center mb-1">
            Guided Prayer
          </Text>
          <Text className="text-white/90 text-base font-medium text-center mb-4">
            3 minutes
          </Text>
          
          {/* Call to action indicator */}
          <View className="flex-row items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Text className="text-white font-semibold mr-1">
              Start Prayer
            </Text>
            <ChevronRight size={18} color="white" />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}