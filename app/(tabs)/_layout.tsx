import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
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

/**
 * 1. The Animated Icon Component
 * Scales up slightly when active and bounces back.
 */
const AnimatedTabBarIcon = ({ 
  IconComponent, 
  focused, 
  color 
}: { 
  IconComponent: any; 
  focused: boolean; 
  color: string; 
}) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0, {
      duration: 350,
      dampingRatio: 0.5, // Controls the "bounciness"
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate 0 -> 1 to Scale 1 -> 1.2
    const iconScale = interpolate(
      scale.value,
      [0, 1],
      [1, 1.2],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: iconScale }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4ADE80', // Your brand Green
        tabBarInactiveTintColor: '#64748b', // Slate-500
        headerShown: false,
        
        // 2. The Native Tab Bar Style
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0f172a', // Transparent on iOS for Blur
          borderTopWidth: 0, // Remove ugly line
          elevation: 0, // Remove Android shadow
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },

        // 3. The "Glass" Background for iOS
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView 
              tint="dark" 
              intensity={80} 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
          ) : undefined
        ),
      }}
    >
      {/* Tab 1: Home (The Tree) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={Home} focused={focused} color={color} />
          ),
          // Trigger Haptic feedback when pressed
          tabBarButton: (props) => (
            <View 
              onTouchEnd={() => Haptics.selectionAsync()} 
              style={{ flex: 1 }}
            >
              {props.children}
            </View>
          ),
        }}
      />

      {/* Tab 2: Community (Allies) */}
      <Tabs.Screen
        name="allies" // Note: Rename your file from 'community' to 'allies' to match your data model
        options={{
          title: 'Allies',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={Users} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <View onTouchEnd={() => Haptics.selectionAsync()} style={{ flex: 1 }}>{props.children}</View>
          ),
        }}
      />

      {/* Tab 3: Check-In (New Feature) */}
      {/* I recommend adding this as the center tab later for the "HALT" check-in */}
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check In',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={ShieldCheck} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <View onTouchEnd={() => Haptics.selectionAsync()} style={{ flex: 1 }}>{props.children}</View>
          ),
        }}
      />

      {/* Tab 4: Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabBarIcon IconComponent={Settings} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <View onTouchEnd={() => Haptics.selectionAsync()} style={{ flex: 1 }}>{props.children}</View>
          ),
        }}
      />
    </Tabs>
  );
}