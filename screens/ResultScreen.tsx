import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width, height } = Dimensions.get('window');
const BAR_MAX_HEIGHT = height * 0.45; // Max height for the tallest bar (45% of screen)

export default function ResultsScreen() {
  const router = useRouter();

  // --- Animation Values ---
  const redBarAnim = useRef(new Animated.Value(0)).current;
  const blueBarAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // --- Counter State ---
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);

  useEffect(() => {
    // 1. Start the analysis simulation on mount
    animateResults();
  }, []);

  const animateResults = () => {
    // Trigger Haptics to feel like "processing"
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate Bars Growing
    Animated.parallel([
      Animated.timing(redBarAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false, // Height doesn't support native driver
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(blueBarAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 1500, // Wait for bars to mostly finish
        useNativeDriver: true,
      }),
    ]).start();

    // Animate Numbers Counting Up (Sync with bar duration ~2000ms)
    let startTimestamp: number | null = null;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for numbers (easeOutExpo) to match bars
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setRedCount(Math.floor(easeProgress * 94)); // Target: 94%
      setBlueCount(Math.floor(easeProgress * 30)); // Target: 30%

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to your solution/paywall screen
    router.push('/(auth)/features'); 
  };

  // Interpolate animated values to heights
  const redHeight = redBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_MAX_HEIGHT * 0.94], // 94% of max height
  });

  const blueHeight = blueBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_MAX_HEIGHT * 0.30], // 30% of max height
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient matching the screenshot */}
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Results</Text>
        </View>

        {/* --- Chart Area --- */}
        <View style={styles.chartContainer}>
          
          {/* Red Bar (User) */}
          <View style={styles.barWrapper}>
            <Text style={styles.percentageText}>{redCount}%</Text>
            <Animated.View style={[styles.bar, styles.redBar, { height: redHeight }]} />
            <Text style={styles.labelLabel}>Your Dependency</Text>
          </View>

          {/* Blue Bar (Benchmark) */}
          <View style={styles.barWrapper}>
            <Text style={styles.percentageText}>{blueCount}%</Text>
            <Animated.View style={[styles.bar, styles.blueBar, { height: blueHeight }]} />
            <Text style={styles.labelLabel}>Healthy Range</Text>
          </View>

        </View>

        {/* --- Analysis Text --- */}
        <Animated.View style={[styles.contentContainer, { opacity: contentOpacity }]}>
          <Text style={styles.descriptionText}>
            This shows a <Text style={styles.highlightText}>high dependency</Text> on explicit material. 
            Without intervention, this pattern typically leads to escalated usage and emotional isolation.
          </Text>

          <Button onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.buttonText}>See Your Plan</Text>
          </Button>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Sans-Medium',
    letterSpacing: 0.5,
  },
  
  // Chart Styles
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end', // Align bars to bottom
    height: BAR_MAX_HEIGHT + 60, // Add space for labels
    gap: 40, // Space between bars
    paddingHorizontal: 20,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 80,
  },
  bar: {
    width: 60,
    borderRadius: 8,
    marginBottom: 16,
  },
  redBar: {
    backgroundColor: '#ef4444', // Red-500
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  blueBar: {
    backgroundColor: '#3b82f6', // Blue-500
    opacity: 0.8,
  },
  percentageText: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Sans-Bold',
    marginBottom: 12,
  },
  labelLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'Sans-Medium',
    position: 'absolute',
    bottom: -24, // Push below the bar
    width: 120,
    textAlign: 'center',
  },

  // Bottom Content Styles
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 20,
    gap: 32,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: 'Sans-Regular',
  },
  highlightText: {
    color: '#ef4444', // Match red bar
    fontFamily: 'Sans-Bold',
  },
  nextButton: {
    backgroundColor: '#FFF',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#020617',
    fontSize: 18,
    fontFamily: 'Sans-Bold',
  },
});