import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { UserMenu } from '@/components/user-menu';
import { useUser } from '@clerk/clerk-expo';
import { Link, Stack } from 'expo-router';
import { MoonStarIcon, XIcon, SunIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO = {
  light: require('@/assets/images/unhooked-ios-light.png'),
  dark: require('@/assets/images/icon.png'),
};

const LOGO_STYLE: ImageStyle = {
  height: 36,
  width: 40,
};

const SCREEN_OPTIONS = {
  header: () => (
    <View className="top-safe absolute left-0 right-0 flex-row justify-between px-4 py-2 web:mx-2">
      <ThemeToggle />
      <UserMenu />
    </View>
  ),
};

export default function Screen() {
  const { colorScheme } = useColorScheme();
  const { user } = useUser();

  const gradientColors = colorScheme === 'dark' 
    ? ['#1a1a2e', '#16213e', '#0f3460'] 
    : ['#fff5f0', '#f0f8ff', '#e6f3ff'];

  const benefits = [
    "Personalized recovery plan",
    "Track your progress daily", 
    "Connect with support community",
    "Science-based approach"
  ];

  return (
    <View style={{ flex: 1 }}>
   
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6"
        >
          {/* Hero Section */}
          <View className="flex-1 justify-center items-center pt-18 pb-8">
            {/* Main Icon/Logo Area */}
      

            {/* Title */}
            <Text 
              variant="h1" 
              className="mb-4 text-left font-bold text-7xl text"
            >
              Ready to Flee From Porn?
            </Text>

            {/* Subtitle */}
            <Text 
              className="text-left text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            >
              Take our quick assessment to create your personalized recovery journey
            </Text>

          
          </View>

          {/* CTA Section */}
          <View className="pb-8">
            <Link href={'/quizzes'} asChild>
                <Button size={'lg'}>
                  <Text>
                    Start Assessment
                  </Text>
                </Button>
            </Link>

            <Text className="text-muted-foreground text-sm text-center mt-4">
              Takes less than 3 minutes . Your privacy is protected
            </Text>
            <Text className='text-muted-foreground text-sm text-center'></Text>
          </View>
        </ScrollView>
    </View>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button 
      onPress={toggleColorScheme} 
      size="icon" 
      variant="ghost" 
      className="rounded-full bg-white/10 backdrop-blur-sm"
    >
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-6 text-gray-700 dark:text-gray-200" />
    </Button>
  );
}