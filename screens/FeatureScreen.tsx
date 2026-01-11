import React, { useState, useRef } from 'react';
import { 
  StyleSheet, View, FlatList, Dimensions, Animated, 
  Image, ViewToken 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ShieldAlert, BookOpen, Leaf, MessageCircle, ArrowRight, LucideIcon, LucideProps } from 'lucide-react-native';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width, height } = Dimensions.get('window');

type FeatureProps ={
  id: string;
  title: string;
  desc : string;
  icon: React.ReactNode
  illustration ?: any;
  color: string
}

const FEATURES: FeatureProps[]= [
  {
    id: 'exit',
    title: 'The Emergency Exit',
    desc: 'One tap to kill an urge. Get immediate grounding exercises and scripture when you need it most.',
    icon: <ShieldAlert size={32} color="#FFF" />,
    // illustration: require('@/assets/images/Onboarding(Solution and App Features).png'), // Your top image
    color: '#EF4444',
  },
  {
    id: 'liturgy',
    title: 'Daily Liturgy',
    desc: 'Morning and evening rhythms designed to rewire your neural pathways through prayer and science.',
    icon: <BookOpen size={32} color="#FFF" />,
    // illustration: require('@/assets/images/Learn.png'),
    color: '#0D9488',
  },
  {
    id: 'tree',
    title: 'The Life Tree',
    desc: 'Visualize your progress. As you stay clean, your digital tree grows from a seed to a flourishing oak.',
    icon: <Leaf size={32} color="#FFF" />,
    // illustration: require('@/assets/images/Home.png'),
    color: '#10B981',
  },
  {
    id: 'community',
    title: 'Anonymous Circles',
    desc: 'Heal in the light. Connect with others on the same journey without ever revealing your identity.',
    icon: <MessageCircle size={32} color="#FFF" />,
    
    color: '#6366F1',
  }
];

const FeatureScreen = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Track the current slide index
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderItem = ({ item }: { item: typeof FEATURES[0] }) => (
    <View style={styles.slide}>
      {/* Top Illustration Section */}
      <View style={styles.imageContainer}>
        <Image source={item.illustration} style={styles.image} resizeMode="contain" />
      </View>

      {/* Bottom Content Section */}
      <View style={styles.contentContainer}>
        <View style={[styles.iconBadge, { backgroundColor: item.color + '20' }]}>
          {item.icon}
        </View>
        <Text variant={'h2'}>{item.title}</Text>
        <Text style={styles.description}>{item.desc}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#082f49']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={FEATURES}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          keyExtractor={(item) => item.id}
        />

        {/* Pagination & Footer */}
        <View style={styles.footer}>
          <View style={styles.paginationContainer}>
            {FEATURES.map((_, i) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [10, 24, 10],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
            })}
          </View>

          <Button 
            onPress={() => currentIndex === FEATURES.length - 1 
              ? router.replace('/(auth)/login') 
              : flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })}
            style={styles.mainButton}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonLabel}>
                {currentIndex === FEATURES.length - 1 ? "Enter The Sanctuary" : "Next"}
              </Text>
              <ArrowRight size={20} color="#000" />
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default FeatureScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  slide: { width, flex: 1 },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: { width: '100%', height: '80%' },
  contentContainer: {
    flex: 0.4,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontFamily: 'Serif-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Sans-Regular',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D9488',
  },
  mainButton: {
    backgroundColor: '#FFF',
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonLabel: { color: '#000', fontSize: 18, fontFamily: 'Sans-Bold' },
});