import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

// --- Components ---
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import BibleVerse from '@/components/BibleVerse';
import GardenScene from '@/components/GardenScene';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const COLORS = {
  background: '#020617',
  card: 'rgba(30, 41, 59, 0.4)',
  primary: '#6366f1', // Indigo
  danger: '#ef4444', // Red
  success: '#10b981', // Emerald
  text: '#f8fafc',
  muted: '#94a3b8',
};

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [declareText, setDeclareText] = useState('');

  // --- BOTTOM SHEET REFS ---
  const declareSheetRef = useRef<BottomSheetModal>(null);
  const praySheetRef = useRef<BottomSheetModal>(null);
  const resetSheetRef = useRef<BottomSheetModal>(null);
  const panicSheetRef = useRef<BottomSheetModal>(null);

  // --- SNAP POINTS ---
  const snapPoints = useMemo(() => ['50%', '75%'], []);
  const panicSnapPoints = useMemo(() => ['60%'], []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchProfile(data.user.id);
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('current_streak')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  // --- HANDLERS ---
  const handleOpenSheet = (type: 'declare' | 'pray' | 'reset' | 'panic') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (type === 'declare') declareSheetRef.current?.present();
    if (type === 'pray') praySheetRef.current?.present();
    if (type === 'reset') resetSheetRef.current?.present();
    if (type === 'panic') panicSheetRef.current?.present();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
    ),
    []
  );

  const handleVictory = async () => {
    // ... (Keep your existing Supabase logic here)
    Alert.alert('Victory!', 'Your streak has been updated.');
    declareSheetRef.current?.dismiss();
    praySheetRef.current?.dismiss();
  };

  const handleReset = async () => {
    // ... (Keep your existing reset logic here)
    Alert.alert('Reset', 'Streak reset to 0.');
    resetSheetRef.current?.dismiss();
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text variant="h2" style={styles.title}>
                Unhooked
              </Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/settings')}>
              <Ionicons name="person-circle-outline" size={32} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {/* GARDEN HERO */}
          <View style={styles.gardenContainer}>
            <GardenScene streakDays={profile?.current_streak || 0} />
            <BlurView intensity={30} tint="dark" style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#fbbf24" />
              <Text style={styles.streakText}>{profile?.current_streak || 0} Days Free</Text>
            </BlurView>
          </View>

          {/* ACTION GRID (Redesigned) */}
          <Text style={styles.sectionTitle}>Daily Actions</Text>
          <View style={styles.gridContainer}>
            {/* 1. DECLARE */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}
              onPress={() => handleOpenSheet('declare')}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="mic" size={22} color="#FFF" />
              </View>
              <Text style={styles.actionTitle}>Declare</Text>
              <Text style={styles.actionSubtitle}>Speak Life</Text>
            </TouchableOpacity>

            {/* 2. PRAY */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
              onPress={() => handleOpenSheet('pray')}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.success }]}>
                <MaterialCommunityIcons name="hands-pray" size={22} color="#FFF" />
              </View>
              <Text style={styles.actionTitle}>Pray</Text>
              <Text style={styles.actionSubtitle}>Find Strength</Text>
            </TouchableOpacity>

            {/* 3. ALLIES */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}
              onPress={() => router.push('/allies')}>
              <View style={[styles.iconCircle, { backgroundColor: '#0ea5e9' }]}>
                <Ionicons name="people" size={22} color="#FFF" />
              </View>
              <Text style={styles.actionTitle}>Allies</Text>
              <Text style={styles.actionSubtitle}>Community</Text>
            </TouchableOpacity>

            {/* 4. RESET */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
              onPress={() => handleOpenSheet('reset')}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.danger }]}>
                <Ionicons name="refresh" size={22} color="#FFF" />
              </View>
              <Text style={styles.actionTitle}>Reset</Text>
              <Text style={styles.actionSubtitle}>Start Over</Text>
            </TouchableOpacity>
          </View>

          {/* BIBLE VERSE COMPONENT */}
          <View style={{ marginTop: 24 }}>
            <BibleVerse />
          </View>

          {/* PANIC BUTTON (Bottom Fixed-ish) */}
          <TouchableOpacity
            style={styles.panicButton}
            activeOpacity={0.8}
            onPress={() => handleOpenSheet('panic')}>
            <LinearGradient
              colors={['#7f1d1d', '#b91c1c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.panicGradient}>
              <View style={styles.panicContent}>
                <View style={styles.pulseContainer}>
                  <Ionicons name="warning" size={24} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.panicTitle}>Emergency Support</Text>
                  <Text style={styles.panicSubtitle}>Feeling triggered? Tap here.</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* --- BOTTOM SHEETS --- */}

      {/* 1. DECLARE SHEET */}
      <BottomSheetModal
        ref={declareSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#1e293b' }}
        handleIndicatorStyle={{ backgroundColor: '#475569' }}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Declare Victory</Text>
          <Text style={styles.sheetSubtitle}>
            There is power in your words. Speak your freedom.
          </Text>

          <BottomSheetTextInput
            style={styles.sheetInput}
            placeholder="I am strong because..."
            placeholderTextColor="#64748B"
            multiline
            value={declareText}
            onChangeText={setDeclareText}
          />

          <TouchableOpacity style={styles.sheetButtonPrimary} onPress={handleVictory}>
            <Text style={styles.sheetButtonText}>Confirm Declaration</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

      {/* 2. PRAY SHEET */}
      <BottomSheetModal
        ref={praySheetRef}
        index={0}
        snapPoints={['65%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#1e293b' }}
        handleIndicatorStyle={{ backgroundColor: '#475569' }}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>A Moment of Prayer</Text>
          <View style={styles.quoteBox}>
            <Text style={styles.prayerText}>
              "Lord, grant me the serenity to accept the things I cannot change, courage to change
              the things I can, and wisdom to know the difference."
            </Text>
          </View>
          <TouchableOpacity style={styles.sheetButtonPrimary} onPress={handleVictory}>
            <Text style={styles.sheetButtonText}>Amen</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

      {/* 3. PANIC SHEET */}
      <BottomSheetModal
        ref={panicSheetRef}
        index={0}
        snapPoints={panicSnapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#450a0a' }} // Dark Red Background
        handleIndicatorStyle={{ backgroundColor: '#fca5a5' }}>
        <BottomSheetView style={[styles.sheetContent, { alignItems: 'center' }]}>
          <Ionicons
            name="shield-checkmark"
            size={64}
            color="#fca5a5"
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.sheetTitle, { color: '#fee2e2' }]}>You are Safe.</Text>
          <Text style={[styles.sheetSubtitle, { color: '#fca5a5', textAlign: 'center' }]}>
            This urge will pass in 15 minutes. Just breathe. You have overcome 100% of your bad days
            so far.
          </Text>

          <View style={styles.panicActions}>
            <TouchableOpacity style={styles.panicActionButton}>
              <Ionicons name="call" size={20} color="#000" />
              <Text style={styles.panicActionText}>Call Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.panicActionButton}>
              <Ionicons name="musical-notes" size={20} color="#000" />
              <Text style={styles.panicActionText}>Calm Audio</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* 4. RESET SHEET */}
      <BottomSheetModal
        ref={resetSheetRef}
        index={0}
        snapPoints={['65%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#1e293b' }}
        handleIndicatorStyle={{ backgroundColor: '#475569' }}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: '#ef4444' }]}>Reset Streak?</Text>
          <Text style={styles.sheetSubtitle}>
            Relapse is a part of recovery, not the end of it. Be honest with yourself.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              style={[styles.sheetButtonPrimary, { backgroundColor: '#334155', flex: 1 }]}
              onPress={() => resetSheetRef.current?.dismiss()}>
              <Text style={styles.sheetButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetButtonPrimary, { backgroundColor: '#ef4444', flex: 1 }]}
              onPress={handleReset}>
              <Text style={styles.sheetButtonText}>Reset to 0</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: "Sans-Regular"
  },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', fontFamily: 'Sans-Bold' },
  profileButton: { padding: 4 },

  // Garden
  gardenContainer: { marginBottom: 30, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  streakBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  streakText: { color: '#FFF', fontSize: 12, fontWeight: '700', fontFamily: 'Sans-Regular' },

  // Grid
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 16, fontFamily: 'Sans-Medium' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: (width - 52) / 2, // 2 column layout
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4, fontFamily: 'Sans-Medium' },
  actionSubtitle: { color: COLORS.muted, fontSize: 12, fontFamily: 'Sans-Regular' },

  // Panic Button
  panicButton: { marginTop: 24, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  panicGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panicContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pulseContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panicTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', fontFamily: 'Sans-Medium' },
  panicSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Sans-Regular' },

  // Sheet Styles
  sheetContent: { flex: 1, padding: 24 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  sheetSubtitle: { fontSize: 16, color: '#94a3b8', lineHeight: 24, marginBottom: 24 },
  sheetInput: {
    backgroundColor: '#334155',
    color: '#FFF',
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 24,
  },
  sheetButtonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Prayer specific
  quoteBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 30,
  },
  prayerText: { color: '#e2e8f0', fontSize: 18, fontStyle: 'italic', lineHeight: 28 },

  // Panic Sheet specific
  panicActions: { flexDirection: 'row', gap: 16, marginTop: 20, width: '100%' },
  panicActionButton: {
    flex: 1,
    backgroundColor: '#fecaca',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  panicActionText: { color: '#7f1d1d', fontWeight: '700', fontSize: 16, fontFamily: "Sans-Regular" },
});
