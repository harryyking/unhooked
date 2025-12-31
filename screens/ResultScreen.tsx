import React, { useState, useRef } from 'react';
import { View, FlatList, Dimensions, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Brain, Heart, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    tag: 'THE BIOLOGY',
    title: 'The Dopamine Trap',
    description: 'Pornography hijacks your brain’s reward system, making real-life joy feel dull and distant.',
    icon: <Brain size={64} color="#FFF" strokeWidth={1.5} />,
    instruction: 'Rewiring begins with understanding the mechanism.'
  },
  {
    id: '2',
    tag: 'THE SPIRIT',
    title: 'The Spiritual Fog',
    description: 'Constant consumption creates a barrier between you and the Holy Spirit, leading to shame and isolation.',
    icon: <Heart size={64} color="#FFF" strokeWidth={1.5} />,
    instruction: 'Grace is the light that breaks the fog.'
  },
  {
    id: '3',
    tag: 'THE PATH',
    title: 'Active Restoration',
    description: 'Unhooked provides the tools to starve the addiction and feed your spirit through science and faith.',
    icon: <Zap size={64} color="#FFF" strokeWidth={1.5} />,
    instruction: 'Your new rhythm of life starts today.'
  }
];

export default function ResultScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(auth)/features');
    }
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slideContainer}>
      {/* Visual Illustration Area */}
      <View style={styles.illustrationWrapper}>
        <View style={styles.iconContainer}>
          {/* Subtle glow behind the icon */}
          <View style={styles.iconGlow} />
          {item.icon}
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.textWrapper}>
        <Text style={styles.tagText}>{item.tag}</Text>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.descriptionText}>{item.description}</Text>
        
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            {item.instruction}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} >
        {/* Simple Progress Indicator */}
        <View style={styles.progressContainer}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.progressDot, 
                { backgroundColor: i === currentIndex ? '#FFF' : 'rgba(255,255,255,0.2)' }
              ]} 
            />
          ))}
        </View>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          keyExtractor={(item) => item.id}
        />

        {/* Footer Button */}
        <View style={styles.footer}>
          <Button 
            onPress={handleNext}
            style={styles.nextButton}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonLabel}>
                {currentIndex === SLIDES.length - 1 ? "Enter Sanctuary" : "Continue"}
              </Text>
              <ArrowRight size={22} color="#000" />
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  progressContainer: {
    flexDirection: 'row',
    paddingTop:10,
    paddingHorizontal: 40,
    height: 3,
    gap: 8,
    marginTop: 20,
  },
  progressDot: {
    flex: 1,
    borderRadius: 2,
  },
  slideContainer: {
    width: width,
    paddingHorizontal: 40,
    flex: 1,
    justifyContent: 'center',
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    filter: 'blur(30px)', // Note: standard blur might require specific Expo modules, or use a PNG
  },
  textWrapper: {
    marginTop: 20,
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Sans-Bold',
    fontSize: 10,
    letterSpacing: 4,
    marginBottom: 12,
  },
  titleText: {
    color: '#FFF',
    fontSize: 38,
    fontFamily: 'Serif-Regular',
    lineHeight: 46,
    marginBottom: 20,
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'Sans-Regular',
    marginBottom: 40,
  },
  instructionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFF',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: 'Serif-Italic',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  nextButton: {
    backgroundColor: '#FFF',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonLabel: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'Sans-Medium',
  },
});