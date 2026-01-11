import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

// --- Types ---
type QuestionType = 'radio' | 'multiselect' | 'text';

interface Option {
  label: string;
  value: string;
}

interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: QuestionType;
  options?: Option[];
  placeholder?: { name: string; age: string };
  validation?: string;
}

// Store answers as a key-value map
// e.g., { gender: 'male', triggers: ['stress', 'boredom'], identity_name: 'John' }
type AnswerValue = string | string[] | { name: string; age: string };
type Answers = Record<string, AnswerValue>;

const { width } = Dimensions.get('window');

// --- Question Data ---
export const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: 'gender',
    text: 'How do you identify?',
    subtext: 'We use this to tailor the community aspect of your recovery.',
    type: 'radio',
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
      { label: 'Non-binary', value: 'non_binary' },
      { label: 'Prefer not to say', value: 'undisclosed' },
    ],
  },
  {
    id: 'age_group',
    text: 'How old are you?',
    type: 'radio',
    options: [
      { label: '13 - 17', value: '13-17' },
      { label: '18 - 24', value: '18-24' },
      { label: '25 - 34', value: '25-34' },
      { label: '35 - 44', value: '35-44' },
      { label: '45+', value: '45+' },
    ],
  },
  {
    id: 'first_exposure',
    text: 'At what age did you first come across explicit material?',
    type: 'radio',
    options: [
      { label: 'Under 10 years old', value: 'under_10' },
      { label: 'Between 11 - 13', value: '11-13' },
      { label: 'Between 14 - 17', value: '14-17' },
      { label: '18 or older', value: '18+' },
    ],
  },
  {
    id: 'frequency',
    text: 'How often do you typically view pornography?',
    type: 'radio',
    options: [
      { label: 'Multiple times daily', value: 'multiple_daily' },
      { label: 'Once daily', value: 'daily' },
      { label: 'A few times a week', value: 'weekly' },
      { label: 'A few times a month', value: 'monthly' },
      { label: 'Rarely', value: 'rarely' },
    ],
  },
  {
    id: 'escalation',
    text: 'Have you noticed a shift towards more extreme or graphic material?',
    subtext: 'This is a common sign of dopamine tolerance.',
    type: 'radio',
    options: [
      { label: 'Yes, significantly', value: 'yes_significant' },
      { label: 'Somewhat', value: 'yes_somewhat' },
      { label: 'No, it has stayed the same', value: 'no' },
    ],
  },
  {
    id: 'arousal_dependency',
    text: 'Do you find it difficult to achieve sexual arousal without pornography or fantasy?',
    type: 'radio',
    options: [
      { label: 'Yes, often', value: 'yes_often' },
      { label: 'Sometimes', value: 'sometimes' },
      { label: 'No, never', value: 'no' },
    ],
  },
  {
    id: 'financial_impact',
    text: 'Have you ever spent money to access explicit material?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  },
  {
    id: 'triggers',
    text: 'What usually triggers your urge to view?',
    subtext: 'Select all that apply.',
    type: 'multiselect',
    options: [
      { label: 'Stress or Anxiety', value: 'stress' },
      { label: 'Boredom', value: 'boredom' },
      { label: 'Emotional discomfort or pain', value: 'emotional_pain' },
      { label: 'Loneliness', value: 'loneliness' },
      { label: 'Insomnia / Late nights', value: 'insomnia' },
    ],
  },
  {
    id: 'referral_source',
    text: 'Where did you hear about us?',
    type: 'radio',
    options: [
      { label: 'Social Media', value: 'social' },
      { label: 'Friend or Family', value: 'referral' },
      { label: 'App Store Search', value: 'search' },
      { label: 'Church / Pastor', value: 'church' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    id: 'identity_name',
    text: "Lastly, what should we call you?",
    subtext: "We'll use this to personalize your dashboard.",
    type: 'text',
    placeholder: { name: 'Your First Name', age: 'Age' }, // Note: Age is technically not needed here as we asked age_group, but kept for your layout
    validation: 'required',
  },
];

export default function QuizScreen() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  
  // Specific state for the final text input step to make binding easier
  const [textInputData, setTextInputData] = useState({ name: '', age: '' });

  const router = useRouter();

  const currentQuestion = ASSESSMENT_QUESTIONS[index];
  const progress = ((index + 1) / ASSESSMENT_QUESTIONS.length) * 100;

  // --- Handlers ---

  const handleOptionSelect = (value: string) => {
    Haptics.selectionAsync();

    if (currentQuestion.type === 'multiselect') {
      // Toggle logic for multiselect
      const currentSelection = (answers[currentQuestion.id] as string[]) || [];
      const isSelected = currentSelection.includes(value);
      
      let newSelection;
      if (isSelected) {
        newSelection = currentSelection.filter(v => v !== value);
      } else {
        newSelection = [...currentSelection, value];
      }
      
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: newSelection }));
    } else {
      // Single select logic
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
      
      // Auto-advance for radio buttons adds a nice snappy feel, 
      // but we'll stick to manual "Next" for consistency if you prefer, 
      // or uncomment below to auto-advance:
      // setTimeout(() => handleNext(), 250);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Save text input data if we are on that step
    if (currentQuestion.type === 'text') {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: textInputData }));
    }

    if (index < ASSESSMENT_QUESTIONS.length - 1) {
      setIndex(index + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Here you would typically save 'answers' to your backend or global store
      console.log('Final Answers:', answers); 
      router.push('/(auth)/results');
    }
  };

  // --- Validation ---
  const isStepValid = () => {
    const currentAnswer = answers[currentQuestion.id];

    if (currentQuestion.type === 'text') {
      return textInputData.name.trim().length > 1;
    }
    
    if (currentQuestion.type === 'multiselect') {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }

    // Radio
    return !!currentAnswer;
  };

  // Helper to check if an option is selected
  const isOptionSelected = (value: string) => {
    const currentAnswer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multiselect' && Array.isArray(currentAnswer)) {
      return currentAnswer.includes(value);
    }
    return currentAnswer === value;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          {/* HEADER */}
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
                from={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.questionContainer}
              >
                <Text style={styles.questionText}>
                  {currentQuestion.text}
                </Text>
                
                {currentQuestion.subtext && (
                  <Text style={styles.subtext}>{currentQuestion.subtext}</Text>
                )}

                {/* --- RENDER BASED ON TYPE --- */}

                {currentQuestion.type === 'text' ? (
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>NAME</Text>
                      <TextInput
                        placeholder={currentQuestion.placeholder?.name}
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        style={styles.textInput}
                        value={textInputData.name}
                        onChangeText={(t) => setTextInputData({ ...textInputData, name: t })}
                        autoFocus
                        autoCorrect={false}
                      />
                    </View>
                    {/* Only show Age input if placeholder exists for it (optional based on your design) */}
                    {currentQuestion.placeholder?.age && (
                       <View style={styles.inputWrapper}>
                       <Text style={styles.inputLabel}>AGE</Text>
                       <TextInput
                         placeholder={currentQuestion.placeholder?.age}
                         placeholderTextColor="rgba(255,255,255,0.2)"
                         keyboardType="numeric"
                         style={styles.textInput}
                         value={textInputData.age}
                         onChangeText={(t) => setTextInputData({ ...textInputData, age: t })}
                       />
                     </View>
                    )}
                  </View>
                ) : (
                  /* Radio & Multiselect Options */
                  <View style={styles.optionsContainer}>
                    {currentQuestion.options?.map((option) => {
                      const selected = isOptionSelected(option.value);
                      
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => handleOptionSelect(option.value)}
                          activeOpacity={0.8}
                          style={[
                            styles.optionCard,
                            selected && styles.optionCardSelected
                          ]}
                        >
                          {/* Visual Indicator: Radio Circle or Checkbox Square */}
                          <View style={[
                            styles.indicatorBase, 
                            currentQuestion.type === 'multiselect' && styles.checkboxBase,
                            selected && styles.indicatorSelected,
                            currentQuestion.type === 'multiselect' && selected && styles.checkboxSelected
                          ]}>
                            {selected && currentQuestion.type === 'radio' && <View style={styles.radioInner} />}
                            {selected && currentQuestion.type === 'multiselect' && <Check size={14} color="#020617" strokeWidth={4} />}
                          </View>

                          <Text style={[
                            styles.optionText,
                            selected && styles.optionTextSelected
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </MotiView>
            </AnimatePresence>
          </ScrollView>

          {/* FOOTER */}
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
  
  // Header
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
    backgroundColor: '#5eead4', // Using your accent teal color
    borderRadius: 2,
  },
  questionCounter: {
    color: '#FFF',
    fontFamily: 'Sans-Medium',
    fontSize: 14,
  },

  // Content
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
    fontSize: 28,
    fontFamily: 'Serif-Regular',
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

  // Inputs
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

  // Options
  optionsContainer: {
    gap: 14,
    marginTop: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  
  // Indicators (Radio vs Checkbox)
  indicatorBase: {
    width: 20,
    height: 20,
    borderRadius: 10, // Circle by default (Radio)
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  checkboxBase: {
    borderRadius: 6, // Square-ish (Checkbox)
  },
  indicatorSelected: {
    backgroundColor: '#020617', // Dark background inside selected item
    borderColor: '#020617',
  },
  checkboxSelected: {
    backgroundColor: '#020617', // Actually, let's keep the indicator dark so the checkmark pops? 
    // Wait, the card is white when selected. So indicator should be dark or accent.
    // Let's make indicator simple:
    // backgroundColor: '#0d9488', // Teal checkbox
    borderColor: '#0d9488',
  },
  
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF', // White dot on dark circle
  },
  
  optionText: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: 'Sans-Medium',
  },
  optionTextSelected: {
    color: '#020617',
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
    borderRadius: 30,
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