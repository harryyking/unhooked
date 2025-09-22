// screens/OnboardingScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowRightIcon, CheckIcon, SkipForwardIcon } from 'lucide-react-native';
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
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Hey There! Welcome to Unhooked.',
    description: 'Ready to ditch old habits and build a stronger, freer you? We\'re here to walk this journey with you, every step of the way.',
    backgroundColor: '#FAFAFF',
    accentColor: '#6366F1',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    icon: '👋',
  },
  {
    id: '2',
    title: 'Discovering Your True Self',
    description: 'God has an awesome plan for your life – full of joy, purpose, and real freedom. This is about stepping into that amazing person He made you to be.',
    backgroundColor: '#FEF3E2',
    accentColor: '#F59E0B',
    textColor: '#92400E',
    subtitleColor: '#A16207',
    icon: '✨',
  },
  {
    id: '3',
    title: 'The Hidden Trap',
    description: 'Porn might seem harmless, or even "normal," but it\'s actually a sneaky trap. It messes with your mind and pulls you away from real connections.',
    backgroundColor: '#FEF2F2',
    accentColor: '#EF4444',
    textColor: '#991B1B',
    subtitleColor: '#B91C1C',
    icon: '⚠️',
  },
  {
    id: '4',
    title: 'Fake vs. Real Connections',
    description: 'God designed relationships to be beautiful and genuine. Porn replaces that with something fake and shallow, making real intimacy harder to find.',
    backgroundColor: '#F0F9FF',
    accentColor: '#0EA5E9',
    textColor: '#0C4A6E',
    subtitleColor: '#0369A1',
    icon: '💝',
  },
  {
    id: '5',
    title: 'Draining Your Inner Strength',
    description: 'The more you\'re exposed to it, the tougher it gets. It can make you feel numb, less caring, and slowly chip away at your spirit.',
    backgroundColor: '#FDF4FF',
    accentColor: '#A855F7',
    textColor: '#7C2D92',
    subtitleColor: '#9333EA',
    icon: '🔋',
  },
  {
    id: '6',
    title: 'The Shame Game',
    description: 'When you keep things hidden, it often brings on guilt and shame. That feeling can build a wall between you, your friends, and even God.',
    backgroundColor: '#FEF2F2',
    accentColor: '#EF4444',
    textColor: '#991B1B',
    subtitleColor: '#B91C1C',
    icon: '😔',
  },
  {
    id: '7',
    title: 'Broken Connections',
    description: 'It can really mess with how you connect with people you care about – your family, your friends, and future relationships. It makes true love harder to build.',
    backgroundColor: '#FEF2F2',
    accentColor: '#DC2626',
    textColor: '#991B1B',
    subtitleColor: '#B91C1C',
    icon: '💔',
  },
  {
    id: '8',
    title: 'Never Enough',
    description: 'Porn promises to satisfy, but it always leaves you feeling empty. You keep wanting more, but it never fills that deep spiritual need inside you.',
    backgroundColor: '#FEF2F2',
    accentColor: '#EF4444',
    textColor: '#991B1B',
    subtitleColor: '#B91C1C',
    icon: '🕳️',
  },
  {
    id: '9',
    title: 'But Hey, There\'s Hope!',
    description: 'Good news! God\'s grace is HUGE, and His mercies are fresh every single morning. He wants you to be totally free and healed.',
    backgroundColor: '#F0FDF4',
    accentColor: '#10B981',
    textColor: '#065F46',
    subtitleColor: '#047857',
    icon: '🌅',
  },
  {
    id: '10',
    title: 'Your Path to Freedom Starts Now',
    description: 'Unhooked is your guide to breaking free. We\'ve got a clear, supportive plan built on faith and real accountability to help you win this battle.',
    backgroundColor: '#F0FDF4',
    accentColor: '#059669',
    textColor: '#065F46',
    subtitleColor: '#047857',
    icon: '🛤️',
  },
  {
    id: '11',
    title: 'Daily Check-ins & Awesome Streaks',
    description: 'Mark your daily victories and watch your streak grow! Seeing those wins keeps you super motivated and strong on your journey.',
    backgroundColor: '#EFF6FF',
    accentColor: '#3B82F6',
    textColor: '#1E40AF',
    subtitleColor: '#2563EB',
    icon: '📈',
  },
  {
    id: '12',
    title: 'Find Your Crew: The Power of Community',
    description: 'Connect with other teens who totally get what you\'re going through. Share, pray, and grow together in a safe, judgment-free zone.',
    backgroundColor: '#EFF6FF',
    accentColor: '#3B82F6',
    textColor: '#1E40AF',
    subtitleColor: '#2563EB',
    icon: '👥',
  },
  {
    id: '13',
    title: 'Daily Bible Wisdom & Devotionals',
    description: 'Power up your spirit every day with God\'s Word. Get scriptures and awesome insights to refresh your mind and guide your steps.',
    backgroundColor: '#EFF6FF',
    accentColor: '#3B82F6',
    textColor: '#1E40AF',
    subtitleColor: '#2563EB',
    icon: '📖',
  },
  {
    id: '14',
    title: 'Your Accountability Squad',
    description: 'Invite a trusted friend or mentor to be your accountability partner. It\'s like having a personal cheer squad and extra support whenever you need it!',
    backgroundColor: '#EFF6FF',
    accentColor: '#3B82F6',
    textColor: '#1E40AF',
    subtitleColor: '#2563EB',
    icon: '🤝',
  },
  {
    id: '15',
    title: 'Ready to Live Free in Christ?',
    description: 'Unhooked is here to help you step into a life of purity, purpose, and real peace. Let\'s do this!',
    backgroundColor: '#F0FDF4',
    accentColor: '#10B981',
    textColor: '#065F46',
    subtitleColor: '#047857',
    icon: '🕊️',
  },
];



const PaginationDots = ({ 
  slides, 
  currentIndex, 
  onDotPress 
}: {
  slides: OnboardingSlide[];
  currentIndex: number;
  onDotPress: (index: number) => void;
}) => {
  return (
    <View className="flex-row justify-center mb-8 flex-wrap">
      {slides.map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onDotPress(index)}
          className={`mx-1 mb-1 rounded-full transition-all duration-300 ${
            index === currentIndex 
              ? 'w-8 h-2 bg-indigo-500' 
              : 'w-2 h-2 bg-gray-300'
          }`}
        />
      ))}
    </View>
  );
};

const SlideComponent = ({ item, index }: { item: OnboardingSlide; index: number }) => {
  return (
    <View 
      style={{ 
        width, 
        height, 
        // backgroundColor: item.backgroundColor 
      }}
      className="justify-center items-center px-8"
    >
      <View className="flex-1 justify-center items-center max-w-sm">
        {/* Icon */}
        <View 
          className="w-24 h-24 rounded-full justify-center items-center mb-8 shadow-lg"
          style={{ backgroundColor: item.accentColor + '15' }}
        >
          <Text className="text-5xl">{item.icon}</Text>
        </View>

        {/* Content */}
        <View className="items-center">
          <Text 
            className="text-2xl font-bold text-center mb-6 leading-8"
            style={{ color: item.textColor }}
          >
            {item.title}
          </Text>
          
          <Text 
            className="text-base text-center leading-6 px-2"
            style={{ color: item.subtitleColor }}
          >
            {item.description}
          </Text>
        </View>
      </View>
    </View>
  );
};

const OnboardingScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleFinishOnboarding = () => {
    router.replace('/(auth)/sign-up');
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

  const goToDot = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const isLastSlide = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex];

  return (
      <View className="flex-1 ">
    <SafeAreaView className="flex-1 bg-white">

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
        />

        {/* Footer Controls */}
        <View className="px-8 pb-8">
          {/* Pagination Dots */}
          <PaginationDots 
            slides={slides}
            currentIndex={currentIndex}
            onDotPress={goToDot}
          />

          {/* Navigation Buttons */}
          <View className="flex-row justify-between items-center">
            {/* Skip Button */}
            {!isLastSlide && (
              <TouchableOpacity
                onPress={skipOnboarding}
                className="flex-row items-center py-3 px-6 rounded-full bg-gray-100"
              >
                <Icon as={SkipForwardIcon} className="w-4 h-4 text-gray-600 mr-2" />
                <Text className="text-gray-600 font-semibold">Skip</Text>
              </TouchableOpacity>
            )}

            {/* Spacer when no skip button */}
            {isLastSlide && <View />}

            {/* Next/Finish Button */}
            <TouchableOpacity
              onPress={goToNextSlide}
              className="flex-row items-center py-4 px-8 rounded-full shadow-lg"
              style={{ 
                backgroundColor: currentSlide.accentColor,
                elevation: 4,
                shadowColor: currentSlide.accentColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Text className="text-white font-bold mr-2 text-base">
                {isLastSlide ? 'Get Started' : 'Next'}
              </Text>
              <Icon 
                as={isLastSlide ? CheckIcon : ArrowRightIcon} 
                className="w-5 h-5 text-white" 
              />
            </TouchableOpacity>
          </View>
        </View>
    </SafeAreaView>
      </View>
  );
};
