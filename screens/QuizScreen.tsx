import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

const { width } = Dimensions.get('window');

// --- Question Data ---
const ASSESSMENT_QUESTIONS = [
  {
    id: 'identity',
    text: "First, let's get to know you.",
    subtext: "Your identity helps us personalize your recovery path.",
    type: 'text',
    placeholder: { name: 'Your First Name', age: 'Age' },
  },
  {
    id: 'gender',
    text: 'How do you identify?',
    type: 'radio',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  },
  {
    id: 'first_exposure',
    text: 'At what age did you first encounter explicit material?',
    type: 'radio',
    options: ['Under 10 years old', 'Between 11 - 13', 'Between 14 - 17', '18 or older'],
  },
  {
    id: 'frequency',
    text: 'How often do you struggle?',
    type: 'radio',
    options: ['Multiple times daily', 'Daily', 'Weekly', 'Rarely'],
  },
  {
    id: 'faith',
    text: 'Has it moved you away from your Christian faith?',
    type: 'radio',
    options: ['I feel disconnected', 'Somewhat', 'No change'],
  },
];

export default function QuizScreen() {
  const [index, setIndex] = useState(0);
  const [formData, setFormData] = useState({ name: '', age: '', selection: '' });
  const router = useRouter();

  const currentQuestion = ASSESSMENT_QUESTIONS[index];
  const progress = ((index + 1) / ASSESSMENT_QUESTIONS.length) * 100;

  const handleOptionSelect = (option: string) => {
    Haptics.selectionAsync();
    setFormData(prev => ({ ...prev, selection: option }));
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (index < ASSESSMENT_QUESTIONS.length - 1) {
      setIndex(index + 1);
      // Reset selection for next question, but keep name/age if going back (logic simplified here)
      setFormData((prev) => ({ ...prev, selection: '' }));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(auth)/results');
    }
  };

  const isStepValid = () => {
    if (currentQuestion.type === 'text') return formData.name.length > 1 && formData.age.length > 0;
    return formData.selection !== '';
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient - Midnight to Teal */}
      <LinearGradient
        colors={['#020617', '#0f172a', '#0d9488']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          {/* HEADER: Minimal Progress */}
          <View style={styles.header}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.questionCounter}>
              {index + 1} <Text style={{color: 'rgba(255,255,255,0.3)'}}>/ {ASSESSMENT_QUESTIONS.length}</Text>
            </Text>
          </View>

          {/* CONTENT AREA */}
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={currentQuestion.id}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ type: 'timing', duration: 400 }}
                style={styles.questionContainer}
              >
                {/* Question Text */}
                <Text style={styles.questionText}>
                  {currentQuestion.id === 'faith' ? `1. ${currentQuestion.text}` : currentQuestion.text}
                </Text>
                
                {currentQuestion.subtext && (
                  <Text style={styles.subtext}>{currentQuestion.subtext}</Text>
                )}

                {/* Input Type: Text Fields */}
                {currentQuestion.type === 'text' ? (
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>NAME</Text>
                      <TextInput
                        placeholder={currentQuestion.placeholder?.name}
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        style={styles.textInput}
                        value={formData.name}
                        onChangeText={(t) => setFormData({ ...formData, name: t })}
                        autoFocus
                      />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>AGE</Text>
                      <TextInput
                        placeholder={currentQuestion.placeholder?.age}
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="numeric"
                        style={styles.textInput}
                        value={formData.age}
                        onChangeText={(t) => setFormData({ ...formData, age: t })}
                      />
                    </View>
                  </View>
                ) : (
                  /* Input Type: Radio Options (Pill Shape) */
                  <View style={styles.optionsContainer}>
                    {currentQuestion.options?.map((option) => {
                      const isSelected = formData.selection === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          onPress={() => handleOptionSelect(option)}
                          activeOpacity={0.8}
                          style={[
                            styles.optionCard,
                            isSelected && styles.optionCardSelected
                          ]}
                        >
                          {/* Radio Dot Visual */}
                          <View style={[
                            styles.radioDot, 
                            isSelected && styles.radioDotSelected
                          ]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>

                          <Text style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </MotiView>
            </AnimatePresence>
          </ScrollView>

          {/* FOOTER BUTTON */}
          <View style={styles.footer}>
            <Button
              disabled={!isStepValid()}
              onPress={handleNext}
              style={[
                styles.nextButton, 
                !isStepValid() && { opacity: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }
              ]}
            >
              <View style={styles.buttonContent}>
                <Text style={[
                  styles.buttonText,
                  !isStepValid() && { color: 'rgba(255,255,255,0.5)' }
                ]}>
                  {index === ASSESSMENT_QUESTIONS.length - 1 ? 'Complete Assessment' : 'Next Question'}
                </Text>
              </View>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  
  // Header Styles
  header: { 
    marginTop: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  questionCounter: {
    color: '#FFF',
    fontFamily: 'Sans-Medium', // Assuming DMSans-Medium
    fontSize: 14,
  },

  // Content Styles
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  questionContainer: {
    width: '100%',
  },
  questionText: {
    color: '#FFF',
    fontSize: 28, // Scaled down slightly from 32 for better fit
    fontFamily: 'Serif-Regular', // Consistent with titles
    lineHeight: 38,
    marginBottom: 12,
  },
  subtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontFamily: 'Sans-Regular',
    marginBottom: 32,
    lineHeight: 24,
  },

  // Input Styles
  inputGroup: { gap: 24, marginTop: 20 },
  inputWrapper: { gap: 8 },
  inputLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: 'Sans-Bold',
  },
  textInput: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    color: '#FFF',
    fontFamily: 'Sans-Regular',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Option Cards (Matching Quiz.png)
  optionsContainer: {
    gap: 16, // Spacing between pills
    marginTop: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 50, // Full Pill Shape
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)', // "Ghost" border
    backgroundColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#FFF', // High contrast active state
    borderColor: '#FFF',
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', // Subtle dot when inactive
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotSelected: {
    backgroundColor: '#000', // Dark dot on white bg
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  optionText: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: 'Sans-Medium',
  },
  optionTextSelected: {
    color: '#020617', // Dark text on white bg
    fontFamily: 'Sans-SemiBold',
  },

  // Footer
  footer: {
    paddingBottom: 20,
    paddingTop: 20,
  },
  nextButton: {
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 30, // Pill shape button
    justifyContent: 'center',
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#020617',
    fontSize: 17,
    fontFamily: 'Sans-SemiBold',
  },
});