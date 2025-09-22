// components/DesireQuiz.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, Dimensions, ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircleIcon, ArrowRightIcon, RefreshCwIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import Svg, { Circle } from 'react-native-svg';
import { quizQuestions, scoreRanges } from '@/lib/assessment';
import { router } from 'expo-router';
import Animated, { useSharedValue, withTiming, useDerivedValue } from 'react-native-reanimated';
import { interpolate } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Progress } from './ui/progress';
import { Label } from './ui/label';

// Interfaces for type safety
interface QuizOption {
  option_text: string;
  score_value: number;
  display_order: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  options: QuizOption[];
}

interface ScoreRange {
  max_score: number;
  message: string;
  color: string;
}

const screenWidth = Dimensions.get('window').width;

// Animated Circle Component
const AnimatedCircle = ({ 
  progress = 0, 
  size = 150, 
  strokeWidth = 15, 
  color = '#6366f1' 
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 1000 });
  }, [progress]);

  const strokeDashoffset = useDerivedValue(() => {
    return interpolate(animatedProgress.value, [0, 100], [circumference, 0]);
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke="#e5e7eb"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>
    </View>
  );
};

// Animated Score Text Component
const AnimatedScoreText = ({ 
  toValue, 
  color 
}: { 
  toValue: number; 
  color: string; 
}) => {
  const animatedValue = useSharedValue(0);
  const [textValue, setTextValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(toValue, { duration: 1000 });
  }, [toValue]);

  const derivedValue = useDerivedValue(() => Math.round(animatedValue.value));

  useEffect(() => {
    const sync = () => setTextValue(derivedValue.value);
    sync(); // Initial sync
    const interval = setInterval(sync, 16); // ~60fps poll
    return () => clearInterval(interval);
  }, [derivedValue]);

  return (
    <Text 
      className="text-6xl font-black" 
      style={{ color }}
    >
      {textValue}
    </Text>
  );
};

export default function DesireQuiz({ 
  onQuizComplete 
}: { 
  onQuizComplete?: (score: number) => void; 
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const { colorScheme } = useColorScheme();
  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  // Calculate the maximum possible score once
  const maxPossibleScore = quizQuestions.reduce(
    (acc, q) => acc + Math.max(...q.options.map(o => o.score_value)), 
    0
  );

  const handleOptionSelect = (questionId: string, optionScore: number) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionScore });
  };

  const goToNextQuestion = () => {
    if (selectedAnswers[currentQuestion.id] === undefined) {
      Alert.alert("Please select an answer", "You need to choose an option before proceeding.");
      return;
    }
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCalculating(true);
      setTimeout(() => {
        calculateResult();
        setIsCalculating(false);
      }, 1500);
    }
  };

  const calculateResult = () => {
    const totalScore = Object.values(selectedAnswers).reduce(
      (sum: number, score: number) => sum + score, 
      0
    );
    setFinalScore(totalScore);
    setQuizSubmitted(true);
    
    if (onQuizComplete) {
      onQuizComplete(totalScore);
    }
  };

  const getResultFeedback = (score: number): ScoreRange => {
    return scoreRanges.find(range => score <= range.max_score) || 
           scoreRanges[scoreRanges.length - 1];
  };

  const resetQuiz = () => {
    setQuizSubmitted(false);
    setFinalScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  };

  // Calculating Screen
  if (isCalculating) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-xl font-semibold text-gray-900 dark:text-white mt-6">
            Calculating Your Result...
          </Text>
          <Text className="text-gray-600 dark:text-gray-300 mt-2 text-center">
            Analyzing your responses to provide personalized insights
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Results Screen
  if (quizSubmitted) {
    const feedback = getResultFeedback(finalScore);
    const scorePercentage = (finalScore / maxPossibleScore) * 100;

    return (
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 py-8"
      >
        <View className="flex-1 justify-center items-center">
          {/* Title */}
          <Text className="text-3xl font-bold mb-8 text-center">
            Your Assessment Result
          </Text>
          
          {/* Score Circle */}
          <View className="items-center mb-8">
            <AnimatedCircle
              progress={scorePercentage}
              size={screenWidth * 0.6}
              strokeWidth={20}
              color={feedback.color}
            />
            <View className="absolute inset-0 justify-center items-center">
              <AnimatedScoreText 
                toValue={finalScore} 
                color={feedback.color} 
              />
              <Text className="text-gray-600 dark:text-gray-300 text-lg mt-2">
                out of {maxPossibleScore}
              </Text>
            </View>
          </View>

          {/* Feedback Message */}
          <View 
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700"
            style={{ borderColor: feedback.color, borderStyle: 'dashed' }}
          >
            <Text className="text-gray-900 dark:text-white text-lg leading-7 text-center">
              {feedback.message}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="w-full space-y-4 pb-6">
            <Button 
              onPress={resetQuiz}
              variant="outline"
              size={'lg'}
              
            >
              <View className="flex-row items-center">
                <Icon as={RefreshCwIcon} className="w-5 h-5 text-gray-700 dark:text-gray-200 mr-2" />
                <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                  Retake Assessment
                </Text>
              </View>
            </Button>

            <Button 
              onPress={() => router.push('/onboarding')}
              size={'lg'}
              className='mt-4'
            >
                <Text className="font-semibold">
                  Get Help Now
                </Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Quiz Questions Screen
  return (
    <SafeAreaView className='flex-1'>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
        className="px-6 py-8"
      >
        {/* Progress Section */}
        <View className="mb-8">
          <Text className="text-center text-gray-600 dark:text-gray-300 mb-2">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </Text>
          <Progress value={(currentQuestionIndex + 1) / quizQuestions.length * 100} max={100}/>
            
        </View>

        {/* Question */}
        <View className="flex-1 justify-center">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-8 text-center leading-8">
            {currentQuestion.question_text}
          </Text>
          
          {/* Options using RadioGroup */}
          <RadioGroup
            value={selectedAnswers[currentQuestion.id]?.toString()}
            onValueChange={(value) => handleOptionSelect(currentQuestion.id, Number(value))}
            className="space-y-4"
          >
            {currentQuestion.options
              .sort((a, b) => a.display_order - b.display_order)
              .map((option, index) => (
                <View key={index} className="flex-row items-center p-4 ">
                  <RadioGroupItem 
                    value={option.score_value.toString()} 
                    id={`option-${currentQuestion.id}-${index}`}
                    className="mr-4"
                  />
                  <Label 
                    htmlFor={`option-${currentQuestion.id}-${index}`} 
                    onPress={() => handleOptionSelect(currentQuestion.id, option.score_value)}
                    className="flex-1 text-gray-900 dark:text-gray-100 text-base leading-6"
                  >
                    {option.option_text}
                  </Label>
                </View>
              ))}
          </RadioGroup>
        </View>
      </ScrollView>
      
      {/* Next Button - Non-absolute for better mobile flow */}
      <View className="px-6 pb-6">
        <Button
          onPress={goToNextQuestion}
          size={'lg'}
          disabled={selectedAnswers[currentQuestion.id] === undefined}
          className="w-full "
        >
          <Text className="font-semibold">
            {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Assessment' : 'Next Question'}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}