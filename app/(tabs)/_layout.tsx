import React, { useEffect } from 'react';
import { Platform, View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, Settings, ShieldCheck } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import { cn } from '@/lib/utils'; // Utility for tailwind classes

/**
 * Reusable Animated Icon
 */
function TabBarIcon({ 
  Icon, 
  focused, 
  color 
}: { 
  Icon: any; 
  focused: boolean; 
  color: string; 
}) {
  const scale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0, {
      mass: 1,
      damping: 15,
      stiffness: 120,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [1, 1.2], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={animatedStyle} className="items-center justify-center">
      <Icon 
        size={24} 
        color={color} 
        strokeWidth={focused ? 2.5 : 2} 
      />
      {focused && (
        <Animated.View 
          className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary"
          style={{ opacity: scale.value }}
        />
      )}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text + '80', // 50% opacity
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 10,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.card,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView 
              intensity={80} 
              tint="dark" 
              className="absolute inset-0"
            />
          ) : null
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: (p) => <TabBarIcon Icon={Home} {...p} />,
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="allies"
        options={{
          title: 'Allies',
          tabBarIcon: (p) => <TabBarIcon Icon={Users} {...p} />,
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check In',
          tabBarIcon: (p) => <TabBarIcon Icon={ShieldCheck} {...p} />,
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: (p) => <TabBarIcon Icon={Settings} {...p} />,
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />
    </Tabs>
  );
}

/**
 * Wraps the Tab Button to provide Haptics and NativeWind styling
 */
function HapticTabButton(props: any) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.(e);
      }}
      className="flex-1 items-center justify-center active:opacity-70"
    />
  );
}