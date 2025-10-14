import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import { MoonStarIcon, XIcon, SunIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Image, type ImageStyle, View, ScrollView } from 'react-native';

const SCREEN_OPTIONS = {
  header: () => (
    <View className="top-safe absolute left-0 right-0 flex-row justify-between px-4 py-2 web:mx-2">
      <ThemeToggle />
    </View>
  ),
};

export default function Screen() {
  const { colorScheme } = useColorScheme();


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
              className="mb-4 text-left text-6xl font-bold text-foreground tracking-tight"
            >
              Ready to Break Free?
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