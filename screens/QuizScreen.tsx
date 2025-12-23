import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/lib/store';

const QUESTIONS = [
  "Do you often check your phone immediately after waking up?",
  "Have you ever tried to stop but failed within a few days?",
  "Do you feel anxious when you cannot access your device?",
  // ... add all 15 questions
];

export default function QuizScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const setScore = useAppStore((state) => state.setQuizScore);

  const handleAnswer = (value: number) => {
    // value: 1 (No) to 5 (Yes)
    setScore((prev: number) => prev + value);
    
    if (index < QUESTIONS.length - 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIndex(index + 1);
    } else {
      router.push('/(auth)/results');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${((index + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>

      <Text style={styles.questionCounter}>Question {index + 1} of {QUESTIONS.length}</Text>
      <Text style={styles.questionText}>{QUESTIONS[index]}</Text>

      <View style={styles.options}>
        {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'].map((option, i) => (
          <TouchableOpacity 
            key={option} 
            style={styles.optionButton}
            onPress={() => handleAnswer(i + 1)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  progressContainer: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginBottom: 30 },
  progressBar: { height: '100%', backgroundColor: '#4ADE80', borderRadius: 3 },
  questionCounter: { color: '#94a3b8', fontSize: 14, marginBottom: 12 },
  questionText: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 40 },
  options: { gap: 12 },
  optionButton: { backgroundColor: '#1e293b', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  optionText: { color: '#fff', fontSize: 16, textAlign: 'center', fontWeight: '600' }
});