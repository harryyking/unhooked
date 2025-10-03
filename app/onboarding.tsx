// screens/OnboardingScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowRightIcon, CheckIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  subtitleColor: string;
  icon?: string;
  category?: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    category: 'WELCOME',
    title: 'Welcome to Unhooked',
    description: 'Ready to ditch old habits and build a stronger, freer you? We\'re here to walk this journey with you.',
    backgroundColor: '#FAFAFF',
    accentColor: '#6366F1',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    icon: '👋',
  },
  {
    id: '2',
    category: 'PURPOSE',
    title: 'Discover Your True Self',
    description: 'God has an awesome plan for your life – full of joy, purpose, and real freedom.',
    backgroundColor: '#FEF3E2',
    accentColor: '#F59E0B',
    textColor: '#92400E',
    subtitleColor: '#A16207',
    icon: '✨',
  },
  {
    id: '3',
    category: 'AWARENESS',
    title: 'The Hidden Trap',
    description: 'Porn might seem harmless, but it\'s actually a sneaky trap that pulls you away from real connections.',
    backgroundColor: '#FEF2F2',
    accentColor: '#EF4444',
    textColor: '#991B1B',
    subtitleColor: '#B91C1C',
    icon: '⚠️',
  },
  {
    id: '4',
    category: 'RELATIONSHIPS',
    title: 'Real Connections Matter',
    description: 'God designed relationships to be beautiful and genuine. Don\'t settle for something fake and shallow.',
    backgroundColor: '#F0F9FF',
    accentColor: '#0EA5E9',
    textColor: '#0C4A6E',
    subtitleColor: '#0369A1',
    icon: '💝',
  },
  {
    id: '5',
    category: 'IMPACT',
    title: 'Protect Your Strength',
    description: 'The more you\'re exposed to it, the tougher it gets. It can make you feel numb and chip away at your spirit.',
    backgroundColor: '#FDF4FF',
    accentColor: '#A855F7',
    textColor: '#7C2D92',
    subtitleColor: '#9333EA',
    icon: '🔋',
  },
  {
    id: '6',
    category: 'FREEDOM',
    title: 'Break Free from Shame',
    description: 'Hidden struggles bring guilt and shame. It\'s time to tear down those walls.',
    backgroundColor: '#FEF2F2',
    accentColor: '#EF4444',
    textColor: '#991B1B',
    subtitleColor: '#B91C1C',
    icon: '😔',
  },
  {
    id: '7',
    category: 'HOPE',
    title: 'There\'s Always Hope',
    description: 'Good news! God\'s grace is HUGE. He wants you to be totally free and healed.',
    backgroundColor: '#F0FDF4',
    accentColor: '#10B981',
    textColor: '#065F46',
    subtitleColor: '#047857',
    icon: '🌅',
  },
  {
    id: '8',
    category: 'YOUR JOURNEY',
    title: 'Your Path to Freedom',
    description: 'Unhooked is your guide to breaking free with a clear plan built on faith and real accountability.',
    backgroundColor: '#F0FDF4',
    accentColor: '#059669',
    textColor: '#065F46',
    subtitleColor: '#047857',
    icon: '🛤️',
  },
  {
    id: '9',
    category: 'FEATURES',
    title: 'Track Your Progress',
    description: 'Mark daily victories and watch your streak grow! Celebrate every win on your journey.',
    backgroundColor: '#EFF6FF',
    accentColor: '#3B82F6',
    textColor: '#1E40AF',
    subtitleColor: '#2563EB',
    icon: '📈',
  },
  {
    id: '10',
    category: 'COMMUNITY',
    title: 'Find Your Crew',
    description: 'Connect with others who get it. Share, pray, and grow together in a safe space.',
    backgroundColor: '#EFF6FF',
    accentColor: '#3B82F6',
    textColor: '#1E40AF',
    subtitleColor: '#2563EB',
    icon: '👥',
  },
  {
    id: '11',
    category: 'DAILY GROWTH',
    title: 'Daily Wisdom',
    description: 'Power up with God\'s Word every day. Get scriptures and insights to guide your steps.',
    backgroundColor: '#EFF6FF',
    accentColor: '#3B82F6',
    textColor: '#1E40AF',
    subtitleColor: '#2563EB',
    icon: '📖',
  },
  {
    id: '12',
    category: 'LET\'S BEGIN',
    title: 'Ready to Live Free?',
    description: 'Step into a life of purity, purpose, and real peace. Your journey starts now!',
    backgroundColor: '#F0FDF4',
    accentColor: '#10B981',
    textColor: '#065F46',
    subtitleColor: '#047857',
    icon: '🕊️',
  },
];

const SlideComponent = ({ item, index }: { item: OnboardingSlide; index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View 
      style={{ width, height: height * 0.75 }}
      className="justify-center items-center px-6"
    >
      <Animated.View 
        className="flex-1 justify-center items-center max-w-sm w-full"
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        }}
      >
        {/* Category Badge */}
        {item.category && (
          <View 
            className="px-3 py-1 rounded-full mb-6"
            style={{ backgroundColor: item.accentColor + '20' }}
          >
            <Text 
              className="text-xs font-bold tracking-wider"
              style={{ color: item.accentColor }}
            >
              {item.category}
            </Text>
          </View>
        )}

        {/* Icon Container with Shadow */}
        <View 
          className="w-32 h-32 rounded-3xl justify-center items-center mb-8"
          style={{ 
            backgroundColor: 'white',
            shadowColor: item.accentColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text className="text-6xl">{item.icon}</Text>
        </View>

        {/* Content */}
        <View className="items-center">
          <Text 
            className="text-3xl font-bold text-center mb-4 leading-9"
            style={{ color: item.textColor }}
          >
            {item.title}
          </Text>
          
          <Text 
            className="text-lg text-center leading-7 px-4"
            style={{ 
              color: item.subtitleColor,
              opacity: 0.9 
            }}
          >
            {item.description}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const PaginationDots = ({ 
  slides, 
  currentIndex,
  scrollX 
}: {
  slides: OnboardingSlide[];
  currentIndex: number;
  scrollX: Animated.Value;
}) => {
  return (
    <View className="flex-row justify-center items-center h-8 mb-6">
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            className="h-2 bg-indigo-500 rounded-full mx-1"
            style={{
              width: dotWidth,
              opacity,
            }}
          />
        );
      })}
    </View>
  );
};

const OnboardingScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressWidth, {
      toValue: ((currentIndex + 1) / slides.length) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const handleFinishOnboarding = () => {
    // Button press animation
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.95,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/(auth)/sign-up');
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinishOnboarding();
    }
  };

  const skipOnboarding = () => {
    handleFinishOnboarding();
  };

  const isLastSlide = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex];

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Progress Bar */}
      <View className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-10">
        <Animated.View
          className="h-full bg-indigo-500"
          style={{
            width: progressWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      <SafeAreaView className="flex-1">
        {/* Skip Button - Top Right */}
        {!isLastSlide && (
          <View className="absolute top-12 right-6 z-10">
            <TouchableOpacity
              onPress={skipOnboarding}
              className="py-2 px-4 rounded-full bg-gray-100/80"
            >
              <Text className="text-gray-600 font-semibold">Skip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={({ item, index }) => <SlideComponent item={item} index={index} />}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          bounces={false}
        />

        {/* Footer */}
        <View className="px-6 pb-8">
          {/* Pagination Dots */}
          <PaginationDots 
            slides={slides}
            currentIndex={currentIndex}
            scrollX={scrollX}
          />

          {/* Main CTA Button */}
          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
            }}
          >
            <TouchableOpacity
              onPress={goToNextSlide}
              activeOpacity={0.8}
              className="w-full py-4 rounded-2xl items-center justify-center flex-row"
              style={{ 
                backgroundColor: currentSlide.accentColor,
                shadowColor: currentSlide.accentColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-white font-bold text-lg mr-2">
                {isLastSlide ? 'Get Started' : 'Continue'}
              </Text>
              <Icon 
                as={isLastSlide ? CheckIcon : ArrowRightIcon} 
                className="w-5 h-5 text-white" 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Step Counter */}
          <View className="mt-4 items-center">
            <Text className="text-gray-400 text-sm">
              {currentIndex + 1} of {slides.length}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingScreen;