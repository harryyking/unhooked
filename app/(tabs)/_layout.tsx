import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { HomeIcon, MessageCircle, LibraryBig, Settings } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'; // Import from Reanimated
import { useEffect } from 'react';

// Reusable animated icon component with Reanimated
const AnimatedTabBarIcon = ({ IconComponent, focused, color }: any) => {
  const scale = useSharedValue(1); // Shared value for scale

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, {
      damping: 10, // Controls bounce (lower = more bouncy)
      stiffness: 100, // Spring tension
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="items-center justify-center" // NativeWind classes for layout tweaks
      style={animatedStyle}
    >
      <IconComponent
        fill={focused ? color : 'none'}
        stroke={focused ? 'none' : color}
        strokeWidth={focused ? 0 : 2}
        size={24}
      />
    </Animated.View>
  );
};

const TabsLayout = () => {
  const { colors} = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: colors.background,
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 0,
          borderTopWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            android: { elevation: 2 },
            ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: -2 }, shadowRadius: 4,  },
          }),
          position: 'absolute', // Optional: makes tab bar float
          bottom: 0,
          left: 0,
          right: 0,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '400',
          marginBottom: 4,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={HomeIcon} focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: 'Home',
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={MessageCircle} focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: 'Community',
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={LibraryBig} focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: 'Resources',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={Settings} focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: 'Settings',
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;