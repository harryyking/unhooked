import { Platform, View, StyleSheet, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/**
 * Animated Icon Component
 * Scales up and glows when focused
 */
function TabBarIcon({ 
  name, 
  focused, 
  color 
}: { 
  name: keyof typeof Ionicons.glyphMap; 
  focused: boolean; 
  color: string; 
}) {

  return (
    <View style={styles.iconContainer}>
      
        <Ionicons 
          name={focused ? name : `${name}-outline` as any} 
          size={24} 
          color={color} 
        />

    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Common options for all screens
  const screenOptions = {
    headerShown: false,
    tabBarShowLabel: true, // Cleaner look without labels
    tabBarActiveTintColor: '#6366f1', // Indigo-500
    tabBarInactiveTintColor: '#94a3b8', // Slate-400
    tabBarStyle: {
      position: 'absolute',
      // bottom: Platform.OS === 'ios' ? 25 : 20,
      left: 20,
      right: 20,
      height: 80,
      borderRadius: 35,
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0f172a', // Fallback for Android
      borderTopWidth: 0,
      elevation: 0, // Remove Android shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    } as const,
    tabBarBackground: () => (
      Platform.OS === 'ios' ? (
        <BlurView 
          intensity={40} 
          tint="dark" 
          style={StyleSheet.absoluteFill} 
        />
      ) : null
    ),
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="home" focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />

      <Tabs.Screen
        name="allies"
        options={{
          title: 'Allies',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="people" focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />

      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="book" focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="settings" focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 50,
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6366f1', // Indigo glow
    shadowColor: '#6366f1',
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
});