import { StyleSheet, View, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text } from './ui/text';
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Textarea } from './ui/textarea';

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

  // Get week's data for horizontal progress bar
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
      question: 'Did you stay clean today?', 
      type: 'yesno',
      subtitle: 'Be honest with yourself'
    },
    { 
      id: 'mood', 
      question: 'How are you feeling?', 
      type: 'select', 
      options: [
        { label: 'Joyful', emoji: '😊' },
        { label: 'Hopeful', emoji: '🌟' },
        { label: 'Tempted', emoji: '⚠️' },
        { label: 'Struggling', emoji: '😔' },
        { label: 'Peaceful', emoji: '🕊️' }
      ],
      subtitle: 'Reflect on your emotions'
    },
    { 
      id: 'triggers', 
      question: 'Any triggers today?', 
      type: 'text',
      subtitle: 'List them to build awareness',
      placeholder: 'e.g., stress, loneliness'
    },
    { 
      id: 'journal', 
      question: 'Quick reflection', 
      type: 'text',
      subtitle: 'What\'s on your mind?',
      placeholder: 'One win, one lesson learned'
    },
  ] as const;

  const handleAnswer = (key: keyof Answers, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (key !== 'triggers' && key !== 'journal') {
      setTimeout(() => setStep((prev) => prev + 1), 200);
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
      }, 2500);
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
    <View className="px-6 py-3 bg-background border-b border-border">
      <View className="h-1.5 bg-muted rounded-full overflow-hidden">
        <View 
          className="h-full bg-primary rounded-full"
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </View>
      <Text className="text-center text-xs text-muted-foreground mt-1.5">
        Step {step + 1} of {questions.length}
      </Text>
    </View>
  );

  const renderWeeklyBar = () => {
    const dayWidth = screenWidth / 8; // 7 days + margin
    const barHeight = 20;

    return (
      <View className="mb-6">
        <Text className="text-center text-sm font-medium text-foreground mb-3">
          This Week's Progress
        </Text>
        <View className="flex-row justify-between items-center px-4">
          {weeklyProgress.map((day, index) => {
            const isToday = day.date === today;
            let bgColor = 'bg-muted';
            let borderColor = 'border-border';
            
            if (day.logged) {
              if (day.clean === true) {
                bgColor = 'bg-green-500';
                borderColor = 'border-green-600';
              } else if (day.clean === false) {
                bgColor = 'bg-red-500';
                borderColor = 'border-red-600';
              }
            } else if (isToday) {
              bgColor = 'bg-blue-500';
              borderColor = 'border-blue-600';
            }

            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            
            return (
              <View key={day.date} className="items-center">
                <View
                  className={`w-${Math.floor(dayWidth)} h-${barHeight} rounded-full border-2 ${bgColor} ${borderColor}`}
                  style={{ width: dayWidth - 10 }}
                />
                <Text className="text-xs text-muted-foreground mt-1 text-center" style={{ width: dayWidth }}>
                  {dayName}
                </Text>
                {day.logged && (
                  <Text className="text-xs font-medium mt-0.5">
                    {day.clean ? '✓' : '✕'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        
        {/* Legend */}
        <View className="flex-row justify-center gap-8 mt-4">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 bg-green-500 rounded-full border border-green-600" />
            <Text className="text-xs text-muted-foreground">Clean</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 bg-red-500 rounded-full border border-red-600" />
            <Text className="text-xs text-muted-foreground">Relapse</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 bg-blue-500 rounded-full border border-blue-600" />
            <Text className="text-xs text-muted-foreground">Today</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuestion = () => {
    if (step >= questions.length) {
      return (
        <View className="flex-1 justify-center items-center px-6 py-8">
          <Ionicons name="checkmark-circle" size={64} color="#10b981" className="mb-4" />
          <Text variant="h3" className="mb-3 text-center">
            Check-in Complete
          </Text>
          <Text className="text-center text-muted-foreground mb-6">
            Your progress is saved. Keep going.
          </Text>
          {answers.clean && (
            <Text className="text-center text-green-600 font-medium mb-4">
              Strong day! 💪
            </Text>
          )}
          {answers.clean === false && (
            <Text className="text-center text-orange-600 font-medium mb-4">
              Fresh start tomorrow.
            </Text>
          )}
        </View>
      );
    }

    const q = questions[step];
    return (
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 32 }}>
        <Text variant="h4" className="text-center mb-2">
          {q.question}
        </Text>
        {q.subtitle && (
          <Text className="text-center text-muted-foreground mb-8 text-sm">
            {q.subtitle}
          </Text>
        )}
        
        {q.type === 'yesno' && (
          <View className="flex-row justify-between gap-4 mb-8">
            <Card className={`flex-1 ${answers.clean === true ? 'border-green-500 bg-green-50/50' : 'border-border'}`}>
              <TouchableOpacity onPress={() => handleAnswer('clean', true)} activeOpacity={0.8}>
                <CardContent className="py-6 items-center">
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" className="mb-2" />
                  <Text className="font-medium">Yes</Text>
                  <Text className="text-xs text-muted-foreground">Clean day</Text>
                </CardContent>
              </TouchableOpacity>
            </Card>
            
            <Card className={`flex-1 ${answers.clean === false ? 'border-red-500 bg-red-50/50' : 'border-border'}`}>
              <TouchableOpacity onPress={() => handleAnswer('clean', false)} activeOpacity={0.8}>
                <CardContent className="py-6 items-center">
                  <Ionicons name="close-circle" size={24} color="#ef4444" className="mb-2" />
                  <Text className="font-medium">No</Text>
                  <Text className="text-xs text-muted-foreground">Be kind to yourself</Text>
                </CardContent>
              </TouchableOpacity>
            </Card>
          </View>
        )}
        
        {q.type === 'select' && (
          <View className="gap-3 mb-8">
            {q.options?.map((option) => (
              <Card 
                key={option.label}
                className={`p-0 ${answers.mood === option.label ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <TouchableOpacity 
                  onPress={() => handleAnswer('mood', option.label)}
                  activeOpacity={0.8}
                  className="p-4 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">{option.emoji}</Text>
                    <Text className="font-medium">{option.label}</Text>
                  </View>
                  {answers.mood === option.label && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}
        
        {q.type === 'text' && (
          <View className="gap-6">
            <Textarea
              value={answers[q.id as keyof Answers] as string}
              onChangeText={(text) => setAnswers((prev) => ({ ...prev, [q.id]: text }))}
              placeholder={q.placeholder}
              multiline={q.id === 'journal'}
              className={`text-base ${q.id === 'journal' ? 'min-h-24' : ''}`}
              textAlignVertical={q.id === 'journal' ? 'top' : undefined}
            />
            
            <View className="items-center">
              {step < questions.length - 1 ? (
                <Button onPress={handleNext} size="lg" className="px-12">
                  <Text className="font-medium">Next</Text>
                </Button>
              ) : (
                <Button onPress={handleSubmit} size="lg" className="px-12">
                  <Text className="font-medium">Submit</Text>
                </Button>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const buttonText = existingLog ? 'View Log' : 'Check in Today';
  const motivationalText = useMemo(() => {
    if (streak === 0) return "Begin your journey";
    if (streak === 1) return "One day stronger";
    if (streak < 7) return "Building habits";
    if (streak < 30) return "Momentum growing";
    return "Mastery achieved";
  }, [streak]);

  return (
    <View>
      <Card className="border-0 shadow-none">
        <CardContent className="p-4">
          {/* Streak Header */}
          <View className="items-center">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-primary">{streak}</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">Day{streak !== 1 ? 's' : ''}</Text>
            <Text className="text-center text-muted-foreground text-sm">{motivationalText}</Text>
          </View>
          
          {renderWeeklyBar()}
        </CardContent>

        <CardFooter className="pt-0 bg-background/50">
          <Button 
            size="lg" 
            className="w-full rounded-xl" 
            onPress={() => setModalVisible(true)}
          >
            <Text className="font-semibold">{buttonText}</Text>
          </Button>
        </CardFooter>
      </Card>

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={resetModal}
      >
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 bg-background border-b border-border">
            <Text variant="h4" className="font-semibold">Daily Check-in</Text>
            <TouchableOpacity 
              onPress={resetModal} 
              className="p-2 rounded-full bg-muted"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="text-muted-foreground" />
            </TouchableOpacity>
          </View>
          
          {step < questions.length && renderProgressBar()}
          
          {renderQuestion()}
          
          {step < questions.length && step > 0 && (
            <View className="px-6 py-3 bg-background border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                onPress={() => setStep((prev) => prev - 1)}
                className="self-start"
              >
                <Text className="text-sm">Back</Text>
              </Button>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default StreakCard;