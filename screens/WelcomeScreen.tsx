import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* --- ZONE 1: IDENTITY --- */}
        <View style={styles.header}>
          <Text variant={'h3'}>Unhooked</Text>
        </View>

        {/* --- ZONE 2: INVITATION --- */}
        <View style={styles.content}>
          <Text style={styles.title}>
            Welcome, {'\n'}Freedom Fighter.
          </Text>
          <Text style={styles.subtitle}>
            Your journey toward a clear mind and a whole heart begins with understanding where you are today.
          </Text>
        </View>

        {/* --- ZONE 3: ACTION --- */}
        <View style={styles.footer}>
          <Button 
            style={styles.ctaButton}
            onPress={() => router.push('/(auth)/quiz')}
          > 
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>Start Quiz</Text>
              <ArrowRight size={20} color="#000" strokeWidth={2.5} />
            </View>
          </Button>

          <Text style={styles.quote}>
            "The truth will set you free." — John 8:32
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  header: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontFamily: 'Sans-SemiBold',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  divider: {
    height: 1,
    width: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 52,
    color: '#FFFFFF',
    fontFamily: 'Sans-Bold',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Sans-Regular', // Inter
    paddingRight: 20,
  },
  footer: {
    alignItems: 'flex-end',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sans-Medium',
  },
  quote: {
    marginTop: 32,
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'Serif-Italic',
  },
});

export default WelcomeScreen;