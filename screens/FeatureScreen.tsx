import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { 
  ShieldAlert, 
  Flame, 
  Leaf, 
  BookOpen, 
  MessageCircle, 
  ArrowRight 
} from 'lucide-react-native';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    id: 'exit',
    title: 'The Emergency Exit',
    desc: 'One tap to kill an urge. Get immediate grounding exercises and scripture when you need it most.',
    icon: <ShieldAlert size={28} color="#FFF" />,
    color: 'rgba(239, 68, 68, 0.2)', // Red tint
  },
  {
    id: 'liturgy',
    title: 'Daily Liturgy',
    desc: 'Morning and evening rhythms designed to rewire your neural pathways through prayer and science.',
    icon: <BookOpen size={28} color="#FFF" />,
    color: 'rgba(255, 255, 255, 0.1)',
  },
  {
    id: 'tree',
    title: 'The Life Tree',
    desc: 'Visualize your progress. As you stay clean, your digital tree grows from a seed to a flourishing oak.',
    icon: <Leaf size={28} color="#FFF" />,
    color: 'rgba(16, 185, 129, 0.2)', // Green tint
  },
  {
    id: 'community',
    title: 'Anonymous Circles',
    desc: 'Heal in the light. Connect with others on the same journey without ever revealing your identity.',
    icon: <MessageCircle size={28} color="#FFF" />,
    color: 'rgba(255, 255, 255, 0.1)',
  }
];

const FeatureScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.tagline}>YOUR ARSENAL</Text>
            <Text style={styles.title}>Built for Victory.</Text>
            <Text style={styles.subtitle}>
              We’ve combined neuro-science with spiritual disciplines to give you everything you need to break free.
            </Text>
          </View>

          {/* Feature Grid/List */}
          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={[styles.iconBox, { backgroundColor: feature.color }]}>
                  {feature.icon}
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Final Call to Action */}
          <View style={styles.footer}>
            <Button 
              onPress={() => router.replace('/(auth)/login')}
              style={styles.mainButton}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.buttonLabel}>Enter The Sanctuary</Text>
                <ArrowRight size={20} color="#000" />
              </View>
            </Button>
            <Text style={styles.privacyNote}>No subscription required to start.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default FeatureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 40,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Sans-Bold',
    fontSize: 10,
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 36,
    fontFamily: 'Serif-Regular',
    marginBottom: 16,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Sans-Regular',
  },
  featureList: {
    gap: 20,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Sans-SemiBold',
    marginBottom: 6,
  },
  featureDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Sans-Regular',
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: '#FFF',
    width: '100%',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonLabel: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'Sans-SemiBold',
  },
  privacyNote: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    marginTop: 20,
    fontFamily: 'Sans-Regular',
  }
});