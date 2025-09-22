import { StyleSheet, View, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text } from './ui/text';
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';

interface Answers {
  clean: boolean | null;
  mood: "Joyful" | "Hopeful" | "Tempted" | "Struggling" | "Peaceful" | null;
  triggers: string;
  journal: string;
}

interface WeeklyProgress {
  date: string;
  clean: boolean | null;
  logged: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const StreakCard: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({
    clean: null,
    mood: null,
    triggers: '',
    journal: '',
  });

  const streak = useQuery(api.progress.getCurrentStreak)?.streak ?? 0;
  const today = new Date().toISOString().split('T')[0];
  const existingLog = useQuery(api.progress.getByDate, { logDate: today });
  const logCheckin = useMutation(api.progress.logDailyCheckin);

  // Get week's data for circular view
  const weekDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const weeklyLogs = useQuery(api.progress.getWeeklyLogs, { dates: weekDates });

  const weeklyProgress: WeeklyProgress[] = useMemo(() => {
    return weekDates.map(date => {
      const log = weeklyLogs?.find(log => log.logDate === date);
      return {
        date,
        clean: log?.clean ?? null,
        logged: !!log
      };
    });
  }, [weekDates, weeklyLogs]);

  useEffect(() => {
    if (existingLog) {
      setAnswers({
        clean: existingLog.clean,
        mood: existingLog.mood || null,
        triggers: (existingLog.triggers || []).join(', '),
        journal: existingLog.journal || '',
      });
    }
  }, [existingLog]);

  const questions = [
    { 
      id: 'clean', 
      question: '🎯 Be honest: Did you stay clean today?', 
      type: 'yesno',
      subtitle: 'Honesty helps you grow stronger'
    },
    { 
      id: 'mood', 
      question: '😊 How was your mood today?', 
      type: 'select', 
      options: [
        { label: 'Joyful', emoji: '😄' },
        { label: 'Hopeful', emoji: '😊' },
        { label: 'Tempted', emoji: '😐' },
        { label: 'Struggling', emoji: '😔' },
        { label: 'Peaceful', emoji: '😌' }
      ],
      subtitle: 'Understanding your emotions is key'
    },
    { 
      id: 'triggers', 
      question: '⚠️ Did you encounter any triggers?', 
      type: 'text',
      subtitle: 'Separate multiple triggers with commas',
      placeholder: 'e.g. stress, social media, boredom'
    },
    { 
      id: 'journal', 
      question: '📝 Any thoughts or reflections?', 
      type: 'text',
      subtitle: 'Share what\'s on your mind today',
      placeholder: 'How are you feeling? What went well? What was challenging?'
    },
  ] as const;

  const handleAnswer = (key: keyof Answers, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (key !== 'triggers' && key !== 'journal') {
      setTimeout(() => setStep((prev) => prev + 1), 300);
    }
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      const triggersArray = answers.triggers.split(',').map((t) => t.trim()).filter(Boolean);
      await logCheckin({
        logDate: today,
        clean: answers.clean!,
        mood: answers.mood!,
        triggers: triggersArray,
        journal: answers.journal,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setStep(questions.length);
      setTimeout(() => {
        setModalVisible(false);
        setStep(0);
        setAnswers({
          clean: null,
          mood: null,
          triggers: '',
          journal: '',
        });
      }, 3000);
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    }
  };

  const resetModal = () => {
    setModalVisible(false);
    setStep(0);
    if (!existingLog) {
      setAnswers({
        clean: null,
        mood: null,
        triggers: '',
        journal: '',
      });
    }
  };

  const renderProgressBar = () => (
    <View className="px-6 py-4 bg-background">
      <View className="h-2 bg-muted rounded-full overflow-hidden">
        <View 
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </View>
      <Text className="text-center text-sm text-muted-foreground mt-2">
        Step {step + 1} of {questions.length}
      </Text>
    </View>
  );

  const renderWeeklyCircle = () => {
    const centerX = 120;
    const centerY = 120;
    const radius = 85; // Increased from 70
    const itemRadius = 12;

    return (
      <View className="items-center mb-6">
        <Svg height="240" width="240" viewBox="0 0 240 240">
          {/* Background circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {weeklyProgress.map((day, index) => {
            const angle = (index * 360 / 7) - 90; // Start from top
            const radian = (angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(radian);
            const y = centerY + radius * Math.sin(radian);
            
            let fillColor = '#f3f4f6'; // Default gray
            let strokeColor = '#d1d5db';
            
            if (day.logged) {
              if (day.clean === true) {
                fillColor = '#10b981'; // Green for clean days
                strokeColor = '#059669';
              } else if (day.clean === false) {
                fillColor = '#ef4444'; // Red for relapses
                strokeColor = '#dc2626';
              }
            } else if (day.date === today) {
              fillColor = '#3b82f6'; // Blue for today if not logged
              strokeColor = '#2563eb';
            }
            
            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            
            return (
              <G key={day.date}>
                <Circle
                  cx={x}
                  cy={y}
                  r={itemRadius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="2"
                />
                {day.logged && day.clean === true && (
                  <SvgText
                    x={x}
                    y={y + 1}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    fontWeight="bold"
                  >
                    ✓
                  </SvgText>
                )}
                {day.logged && day.clean === false && (
                  <SvgText
                    x={x}
                    y={y + 1}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    fontWeight="bold"
                  >
                    ✕
                  </SvgText>
                )}
                <SvgText
                  x={x}
                  y={y + itemRadius + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {dayName}
                </SvgText>
              </G>
            );
          })}
          
          {/* Center streak number - Made larger */}
          <Circle
            cx={centerX}
            cy={centerY}
            r="45" // Increased from 30
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="2"
          />
          <SvgText
            x={centerX}
            y={centerY - 5} // Adjusted position
            textAnchor="middle"
            fontSize="28" // Increased from 20
            fill="#1e293b"
            fontWeight="bold"
          >
            {streak}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 15} // Adjusted position
            textAnchor="middle"
            fontSize="12" // Increased from 10
            fill="#64748b"
            fontWeight="500"
          >
            DAYS
          </SvgText>
        </Svg>
        
        {/* Legend */}
        <View className="flex-row justify-center gap-6 mt-4">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 bg-green-500 rounded-full" />
            <Text className="text-sm text-muted-foreground">Clean</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 bg-red-500 rounded-full" />
            <Text className="text-sm text-muted-foreground">Relapse</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 bg-gray-300 rounded-full" />
            <Text className="text-sm text-muted-foreground">Not logged</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuestion = () => {
    if (step >= questions.length) {
      return (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-6">🎉</Text>
          <Text variant="h2" className="mb-3 text-center">
            Thanks for checking in!
          </Text>
          <Text className="text-center text-muted-foreground mb-4">
            Your progress has been saved
          </Text>
          {answers.clean && (
            <Text className="text-center text-green-600 font-semibold">
              Great job staying clean today! 💪
            </Text>
          )}
          {answers.clean === false && (
            <Text className="text-center text-orange-600 font-semibold">
              Tomorrow is a new opportunity 🌅
            </Text>
          )}
        </View>
      );
    }

    const q = questions[step];
    return (
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <Text variant="h3" className="text-center mb-2">
            {q.question}
          </Text>
          {q.subtitle && (
            <Text className="text-center text-muted-foreground mb-8">
              {q.subtitle}
            </Text>
          )}
          
          {q.type === 'yesno' && (
            <View className="flex-row justify-between gap-4 mb-6">
              <Card 
                className={`flex-1 transition-all duration-200 ${
                  answers.clean === true 
                    ? 'border-green-500 bg-green-50 shadow-lg' 
                    : 'border-border'
                }`}
              >
                <TouchableOpacity 
                  onPress={() => handleAnswer('clean', true)}
                  activeOpacity={0.7}
                >
                  <CardContent className="py-6 items-center">
                    <Text className="text-xl font-semibold mb-1">✅ Yes</Text>
                    <Text className="text-sm text-muted-foreground">Stay strong!</Text>
                  </CardContent>
                </TouchableOpacity>
              </Card>
              
              <Card 
                className={`flex-1 transition-all duration-200 ${
                  answers.clean === false 
                    ? 'border-red-500 bg-red-50 shadow-lg' 
                    : 'border-border'
                }`}
              >
                <TouchableOpacity 
                  onPress={() => handleAnswer('clean', false)}
                  activeOpacity={0.7}
                >
                  <CardContent className="py-6 items-center">
                    <Text className="text-xl font-semibold mb-1">❌ No</Text>
                    <Text className="text-sm text-muted-foreground">Tomorrow's new</Text>
                  </CardContent>
                </TouchableOpacity>
              </Card>
            </View>
          )}
          
          {q.type === 'select' && (
            <View className="gap-3 mb-6">
              {q.options?.map((option) => (
                <Card 
                  key={option.label}
                  className={`transition-all duration-200 ${
                    answers.mood === option.label 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border'
                  }`}
                >
                  <TouchableOpacity 
                    onPress={() => handleAnswer('mood', option.label)}
                    activeOpacity={0.7}
                  >
                    <CardContent className="py-4 px-6 flex-row items-center">
                      <Text className="text-2xl mr-4">{option.emoji}</Text>
                      <Text className="text-lg font-medium">{option.label}</Text>
                      {answers.mood === option.label && (
                        <View className="ml-auto">
                          <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                        </View>
                      )}
                    </CardContent>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
          
          {q.type === 'text' && (
            <View className="gap-6">
              <Input
                value={answers[q.id as keyof Answers] as string}
                onChangeText={(text) => setAnswers((prev) => ({ ...prev, [q.id]: text }))}
                placeholder={q.placeholder}
                multiline={q.id === 'journal'}
                className={q.id === 'journal' ? 'min-h-32 text-base' : 'text-base'}
                textAlignVertical={q.id === 'journal' ? 'top' : 'center'}
              />
              
              <View className="items-center">
                {step < questions.length - 1 ? (
                  <Button onPress={handleNext} size="lg" className="px-8">
                    <Text>Next →</Text>
                  </Button>
                ) : (
                  <Button onPress={handleSubmit} size="lg" className="px-8">
                    <Text>Complete Check-in ✨</Text>
                  </Button>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const buttonText = existingLog ? 'View Today\'s Log 📊' : 'Daily Check-in 📝';
  const streakEmoji = streak === 0 ? '🌱' : streak < 7 ? '🔥' : streak < 30 ? '💪' : '👑';

  return (
    <View>
      <Card className='border-0 overflow-hidden'>
        <CardContent className='p-6'>
          {renderWeeklyCircle()}
          
          <View className="items-center mb-4">
            <Text className="text-4xl mb-2">{streakEmoji}</Text>
            <Text className="text-center text-muted-foreground">
              {streak === 0 && "Start your journey today"}
              {streak === 1 && "Great start! Keep going"}
              {streak > 1 && streak < 7 && "Building momentum"}
              {streak >= 7 && streak < 30 && "Strong streak!"}
              {streak >= 30 && "Incredible dedication!"}
            </Text>
          </View>
        </CardContent>

        <CardFooter className="pt-0">
          <Button 
            size={"lg"} 
            className='rounded-full w-full' 
            onPress={() => setModalVisible(true)}
            disabled={false}
          >
            <Text className="font-semibold">{buttonText}</Text>
          </Button>
        </CardFooter>
      </Card>

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        presentationStyle='pageSheet'
        onRequestClose={resetModal}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row justify-between items-center px-6 py-4 bg-background border-b border-border">
            <Text variant="h4">Daily Check-in</Text>
            <TouchableOpacity 
              onPress={resetModal} 
              className="p-2 rounded-full bg-muted"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {step < questions.length && renderProgressBar()}
          
          {renderQuestion()}
          
          {step < questions.length && step > 0 && (
            <View className="px-6 py-4 bg-background border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                onPress={() => setStep((prev) => prev - 1)}
                className="self-start"
              >
                <Text>← Back</Text>
              </Button>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default StreakCard;