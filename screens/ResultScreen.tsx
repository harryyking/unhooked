import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Shield, Zap } from 'lucide-react-native';

export default function ResultsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* The Diagnosis */}
        <View style={styles.section}>
          <Text style={styles.scoreTitle}>Your Digital Health Score</Text>
          <Text style={styles.score}>CRITICAL</Text>
          <Text style={styles.description}>
            Your results indicate a high dopamine dependency. This affects focus, sleep, and spiritual connection.
          </Text>
        </View>

        {/* Symptoms */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Does this sound familiar?</Text>
          {['Brain fog & lethargy', 'Spiritual distance', 'Loss of time'].map(s => (
            <View key={s} style={styles.row}>
              <CheckCircle size={20} color="#F87171" />
              <Text style={styles.itemText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* The Solution */}
        <View style={[styles.card, { borderColor: '#4ADE80' }]}>
          <Text style={[styles.cardTitle, { color: '#4ADE80' }]}>The Unhooked Method</Text>
          <View style={styles.row}><Shield size={20} color="#4ADE80" /><Text style={styles.itemText}>Neuro-shielding Technology</Text></View>
          <View style={styles.row}><Zap size={20} color="#4ADE80" /><Text style={styles.itemText}>Dopamine Reset Protocol</Text></View>
        </View>

        {/* Reviews */}
        <Text style={styles.reviewText}>"I finally feel like myself again. God is good." - Sarah, 24</Text>

      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/paywall')}>
        <Text style={styles.buttonText}>See My Plan</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ... styles similar to above, dark theme optimized
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    section: { padding: 24, alignItems: 'center' },
    scoreTitle: { color: '#94a3b8', fontSize: 16 },
    score: { color: '#F87171', fontSize: 40, fontWeight: '900', marginVertical: 10 },
    description: { color: '#cbd5e1', textAlign: 'center', lineHeight: 24 },
    card: { margin: 24, padding: 20, backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
    itemText: { color: '#e2e8f0', fontSize: 16 },
    reviewText: { fontStyle: 'italic', color: '#94a3b8', textAlign: 'center', padding: 20 },
    button: { margin: 24, backgroundColor: '#4ADE80', padding: 18, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#064E3B', fontWeight: 'bold', fontSize: 18 }
});