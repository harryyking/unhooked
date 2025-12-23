import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Map stages to local images or URLs
const TREE_IMAGES: Record<number, any> = {
  1: require('../../assets/tree-seed.png'),
  2: require('../../assets/tree-sapling.png'),
  3: require('../../assets/tree-young.png'),
  4: require('../../assets/tree-full.png'),
};

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
  }

  if (!profile) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.username}>{profile.display_name || 'Warrior'}</Text>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{profile.current_streak}</Text>
          <Text style={styles.streakLabel}>Days Clean</Text>
        </View>
        {/* Render the Tree Image based on stage */}
        <Image 
          source={TREE_IMAGES[profile.life_tree_stage || 1]} 
          style={styles.treeImage} 
          resizeMode="contain"
        />
      </View>

      <View style={styles.dailyVerse}>
        <Text style={styles.verseHeader}>Daily Bread</Text>
        <Text style={styles.verseText}>
          "But the fruit of the Spirit is love, joy, peace, forbearance, kindness..."
        </Text>
        <Text style={styles.verseRef}>Galatians 5:22</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' }, // Light green bg for growth
  header: { padding: 24 },
  greeting: { color: '#166534', fontSize: 16 },
  username: { color: '#14532D', fontSize: 28, fontWeight: 'bold' },
  streakCard: { alignItems: 'center', justifyContent: 'center', height: 400 },
  streakInfo: { position: 'absolute', top: 20, alignItems: 'center' },
  streakNumber: { fontSize: 64, fontWeight: '900', color: '#15803D' },
  streakLabel: { fontSize: 16, color: '#166534', fontWeight: '600' },
  treeImage: { width: 300, height: 300, marginTop: 60 },
  dailyVerse: { margin: 24, padding: 20, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  verseHeader: { color: '#4ADE80', fontWeight: 'bold', marginBottom: 8 },
  verseText: { fontSize: 18, color: '#374151', lineHeight: 28, fontStyle: 'italic' },
  verseRef: { marginTop: 12, textAlign: 'right', color: '#6B7280', fontWeight: '600' }
});