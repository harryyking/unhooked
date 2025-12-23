import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';

const VERSES = [
  { text: "I made a covenant with my eyes not to look lustfully at a young woman.", ref: "Job 31:1" },
  { text: "Flee from sexual immorality... Do you not know that your bodies are temples of the Holy Spirit?", ref: "1 Cor 6:18-19" },
  { text: "Walk by the Spirit, and you will not gratify the desires of the flesh.", ref: "Gal 5:16" }
];

export default function WelcomeScreen() {
  const router = useRouter();
  // Simple carousel logic would go here, showing 1 verse at a time

  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1518176258769-f227c798150e' }} style={styles.container}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>UNHOOKED</Text>
          <Text style={styles.tagline}>Renewal for the Digital Age</Text>
        </View>

        <View style={styles.verseContainer}>
          <Text style={styles.verseText}>"{VERSES[0].text}"</Text>
          <Text style={styles.verseRef}>- {VERSES[0].ref}</Text>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/quiz')}
        >
          <Text style={styles.buttonText}>Start My Journey</Text>
          <ArrowRight color="#fff" size={20} />
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { marginTop: 40 },
  appName: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  tagline: { color: '#ccc', fontSize: 16, marginTop: 8 },
  verseContainer: { marginVertical: 40 },
  verseText: { fontSize: 24, color: '#fff', fontStyle: 'italic', lineHeight: 34 },
  verseRef: { color: '#4ADE80', fontSize: 18, marginTop: 16, fontWeight: 'bold' },
  button: { flexDirection: 'row', backgroundColor: '#4ADE80', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#064E3B' }
});