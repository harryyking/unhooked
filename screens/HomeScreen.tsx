import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Mic, 
  HandHeart,
  RotateCcw, 
  Users, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react-native';

// --- UI Components ---
import { Text } from '@/components/ui/text';

const { width } = Dimensions.get('window');

const ACTION_ICONS = [
  { id: 'declare', label: 'Declare', icon: <Mic size={28} color="#FFF" />, route: '/declare' },
  { id: 'pray', label: 'Pray', icon: <Users size={28} color="#FFF" />, route: '/pray' }, // Substitute with Hands icon if available
  { id: 'reset', label: 'Reset', icon: <RotateCcw size={28} color="#FFF" />, route: '/reset' },
  { id: 'pals', label: 'Pals', icon: <Users size={28} color="#FFF" />, route: '/community' },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
  

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. Welcome Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.userName}>Harry Arthur</Text>
          </View>

          {/* 2. Garden Screen Placeholder */}
          <View style={styles.gardenCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
              style={styles.gardenInner}
            >
              <Text style={styles.gardenPlaceholderText}>Garden Screen</Text>
              {/* This is where your interactive growth tree would live */}
            </LinearGradient>
          </View>

          {/* 3. Streak / Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '65%' }]} />
            </View>
          </View>

          {/* 4. Action Icons Grid */}
          <View style={styles.actionsGrid}>
            {ACTION_ICONS.map((action) => (
              <View key={action.id} style={styles.actionItem}>
                <TouchableOpacity style={styles.iconSquare} activeOpacity={0.7}>
                  {action.icon}
                </TouchableOpacity>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
            ))}
          </View>

          {/* 5. Daily Verse Section */}
          <View style={styles.verseSection}>
            <Text style={styles.verseTag}>DAILY VERSE</Text>
            <Text style={styles.verseBody}>
              "Seesth thou a man diligent in his work, he shall work before Kings and not ordinary people"
            </Text>
            <Text style={styles.verseReference}>Proverbs 29:22</Text>
          </View>

          {/* 6. Panic Button (Emergency) */}
          <TouchableOpacity style={styles.panicButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#451a03', '#78350f']} // Deep Burnt Orange/Brown
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.panicGradient}
            >
              <AlertTriangle size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.panicText}>Panic Button</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor:'#020617' },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  
  // Header
  header: { marginBottom: 32 },
  welcomeText: {
    fontSize: 28,
    color: '#FFF',
    fontFamily: 'Serif-Regular',
    opacity: 0.9,
  },
  userName: {
    fontSize: 32,
    color: '#FFF',
    fontFamily: 'Serif-Bold',
    marginTop: -4,
  },

  // Garden Card
  gardenCard: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  gardenInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gardenPlaceholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Sans-Medium',
    fontSize: 18,
  },

  // Progress Bar
  progressContainer: { marginBottom: 40 },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d9488', // Teal
    borderRadius: 4,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  actionItem: {
    alignItems: 'center',
    width: (width - 48 - 48) / 4,
  },
  iconSquare: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Sans-Medium',
  },

  // Verse Section
  verseSection: { marginBottom: 60 },
  verseTag: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Sans-Bold',
    marginBottom: 12,
  },
  verseBody: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Sans-Regular',
    lineHeight: 28,
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Sans-Medium',
    textAlign: 'right',
  },

  // Panic Button
  panicButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)', // Subtle orange border
  },
  panicGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panicText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Sans-Bold',
  }
});