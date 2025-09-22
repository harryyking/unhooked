import { StyleSheet, View, TouchableOpacity, Modal, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Text } from './ui/text';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react'; // Import Convex hook
import { api } from '../convex/_generated/api'; // Adjust path as needed
import AsyncStorage from '@react-native-async-storage/async-storage'; // New import

const { width, height } = Dimensions.get('window');

interface DailyVerse {
  verse: string;
  reference: string;
}

const DevotionalCard: React.FC = () => {
  const [showPrayerModal, setShowPrayerModal] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState<boolean>(true);
  const [verseError, setVerseError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convex action hook
  const getDailyVerse = useAction(api.devotional.getDailyVerseForUser);

  // Prayer phases with guidance text
  const prayerPhases: { time: number; text: string }[] = [
    { time: 60, text: "Take a deep breath and quiet your heart before God" },
    { time: 50, text: "Give thanks for His love and faithfulness today" },
    { time: 35, text: "Bring your worries and concerns to Him" },
    { time: 20, text: "Pray for others - family, friends, and community" },
    { time: 5, text: "Close with gratitude and trust in His plan" },
    { time: 0, text: "Amen. Go in peace, knowing you are loved." }
  ];

  // Fetch daily verse on component mount
// Fetch daily verse on component mount, with caching
useEffect(() => {
  const loadDailyVerse = async () => {
    const cacheKey = 'dailyVerse';
    const today = new Date().toISOString().split('T')[0];

    try {
      // Check cache first
      const storedData = await AsyncStorage.getItem(cacheKey);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.date === today && parsed.verse && parsed.reference) {
          setDailyVerse({ verse: parsed.verse, reference: parsed.reference });
          setIsLoadingVerse(false);
          return; // Use cache, no fetch needed
        }
      }

      // No valid cache: fetch from Convex
      setIsLoadingVerse(true);
      setVerseError(null);
      const verseData = await getDailyVerse();

      // Cache the new data
      const cacheData = { ...verseData, date: today };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

      setDailyVerse(verseData);
    } catch (error) {
      console.error('Error loading daily verse:', error);
      setVerseError('Unable to load daily verse');

      // Fallback to default and cache it temporarily (for today)
      const fallback: DailyVerse = {
        verse: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        reference: 'John 3:16'
      };
      const cacheData = { ...fallback, date: today };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setDailyVerse(fallback);
    } finally {
      setIsLoadingVerse(false);
    }
  };

  loadDailyVerse();
}, [getDailyVerse]);

  useEffect((): (() => void) | undefined => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadAndPlaySound = async (): Promise<void> => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        // You can replace this with your own instrumental audio file
        require('../../assets/audio/prayer-instrumental.mp3'),
        { shouldPlay: true, isLooping: true, volume: 0.3 }
      );
      setSound(sound);
    } catch (error) {
      console.log('Error loading sound:', error);
    }
  };

  const startPrayer = async (): Promise<void> => {
    setTimeLeft(60);
    setIsActive(true);
    setCurrentPhase(0);
    await loadAndPlaySound();
    
    intervalRef.current = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsActive(false);
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  };

  const stopPrayer = async (): Promise<void> => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const closePrayerModal = async (): Promise<void> => {
    await stopPrayer();
    setShowPrayerModal(false);
    setTimeLeft(60);
    setCurrentPhase(0);
  };

  // Update current phase based on time
  useEffect((): void => {
    const phase = prayerPhases.findIndex(phase => timeLeft >= phase.time);
    setCurrentPhase(phase === -1 ? prayerPhases.length - 1 : phase);
  }, [timeLeft]);

  // Auto close modal when prayer ends
  useEffect((): void => {
    if (timeLeft === 0 && isActive === false) {
      setTimeout(async () => {
        await closePrayerModal();
      }, 3000); // Show final message for 3 seconds
    }
  }, [timeLeft, isActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrayerCardPress = (): void => {
    setShowPrayerModal(true);
  };



  const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const formatVerseText = (verseContent: string): string => {
    const cleanedVerse = stripHtmlTags(verseContent);
    // Remove verse numbers and extra whitespace
    return cleanedVerse.replace(/^\d+\s*/, '').trim();
  };

  const formatReference = (reference: string): string => {
    // Convert API reference format (e.g., "JHN.3.16") to readable format
    const parts = reference.split('.');
    if (parts.length >= 3) {
      const bookCode = parts[0];
      const chapter = parts[1];
      const verse = parts[2];
      
      // Map common book codes to full names
      const bookNames: { [key: string]: string } = {
        'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers',
        'DEU': 'Deuteronomy', 'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth',
        '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
        '1CH': '1 Chronicles', '2CH': '2 Chronicles', 'EZR': 'Ezra', 'NEH': 'Nehemiah',
        'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms', 'PRO': 'Proverbs',
        'ECC': 'Ecclesiastes', 'SNG': 'Song of Songs', 'ISA': 'Isaiah', 'JER': 'Jeremiah',
        'LAM': 'Lamentations', 'EZK': 'Ezekiel', 'DAN': 'Daniel', 'HOS': 'Hosea',
        'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah', 'JON': 'Jonah',
        'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah',
        'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi', 'MAT': 'Matthew',
        'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John', 'ACT': 'Acts',
        'ROM': 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', 'GAL': 'Galatians',
        'EPH': 'Ephesians', 'PHP': 'Philippians', 'COL': 'Colossians', '1TH': '1 Thessalonians',
        '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy', 'TIT': 'Titus',
        'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAS': 'James', '1PE': '1 Peter',
        '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
        'JUD': 'Jude', 'REV': 'Revelation'
      };
      
      const bookName = bookNames[bookCode] || bookCode;
      return `${bookName} ${chapter}:${verse}`;
    }
    
    return reference; // Return as-is if format is different
  };

  return (
    <View style={styles.container}>
      {/* Daily Verse Card */}
      <Card className='mb-4 border-0 shadow-none bg-secondary'>
        <CardHeader className='flex-row justify-between items-center'>
          <CardTitle variant={'small'} className='text-muted-foreground'>
            DAILY REFRESH
          </CardTitle>
          <TouchableOpacity>
            {isLoadingVerse ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Ionicons name="refresh" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
        </CardHeader>
        <CardContent>
          {isLoadingVerse ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className='text-muted-foreground text-center mt-2'>
                Loading daily verse...
              </Text>
            </View>
          ) : verseError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
              <Text className='text-red-500 text-center mt-2'>
                {verseError}
              </Text>
            </View>
          ) : dailyVerse ? (
            <Text className='text-lg leading-6'>
              {formatVerseText(dailyVerse.verse)}
            </Text>
          ) : (
            <Text className='text-base leading-6'>
              For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life
            </Text>
          )}
        </CardContent>
        <CardFooter>
          <Text className='font-medium'>
            {dailyVerse ? formatReference(dailyVerse.reference) : 'John 3:16'}
          </Text>
        </CardFooter>
      </Card>

      {/* Prayer Time Card */}
      <TouchableOpacity onPress={handlePrayerCardPress} activeOpacity={0.8}>
        <Card className='overflow-hidden p-0'>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF', '#1E3A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <CardContent className='flex flex-row justify-between items-center p-6'>
              <View style={styles.prayerTextContainer}>
                <CardTitle className='text-white text-xl font-bold mb-2'>
                  Prayer Time
                </CardTitle>
                <CardDescription className='text-blue-100 text-base'>
                  No prayer no breakfast
                </CardDescription>
                <Text className='text-blue-200 text-sm mt-2'>
                  Tap for guided prayer
                </Text>
              </View>

              <View style={styles.prayerIcon}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="hand-left-outline" size={32} color="white" />
                </LinearGradient>
              </View>
            </CardContent>
          </LinearGradient>
        </Card>
      </TouchableOpacity>

      {/* Prayer Modal */}
      <Modal
        visible={showPrayerModal}
        animationType="slide"
        presentationStyle='pageSheet'
        onRequestClose={closePrayerModal}
      >
        <View style={styles.modalOverlay}> 
          <LinearGradient
            colors={['#1E3A8A', '#3730A3', '#1E1B4B']}
            style={styles.modalContent}
          >
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closePrayerModal}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>

            {/* Prayer Content */}
            <View style={styles.prayerContent}>
              <Text style={styles.prayerTitle}>One Minute with God</Text>
              
              {/* Timer Circle */}
              <View style={styles.timerContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.timerCircle}
                >
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                </LinearGradient>
              </View>

              {/* Prayer Guide Text */}
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideText}>
                  {prayerPhases[currentPhase]?.text}
                </Text>
              </View>

              {/* Control Buttons */}
              <View style={styles.controlButtons}>
                {!isActive ? (
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={startPrayer}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="play" size={24} color="white" />
                      <Text style={styles.buttonText}>Start Prayer</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.stopButton}
                    onPress={stopPrayer}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="stop" size={24} color="white" />
                      <Text style={styles.buttonText}>Stop</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

export default DevotionalCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  gradientCard: {
    borderRadius: 12,
  },
  prayerTextContainer: {
    flex: 1,
  },
  prayerIcon: {
    marginLeft: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  enhancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonSubtitleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  prayerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  prayerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  timerContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 20,
  },
  timerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '400',
    color: 'white',
  },
  guideTextContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  guideText: {
    fontSize: 18,
    lineHeight: 26,
    color: 'white',
    textAlign: 'center',
  },
  controlButtons: {
    width: '100%',
    alignItems: 'center',
  },
  startButton: {
    width: '80%',
  },
  stopButton: {
    width: '80%',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8, // Spacing between icon and text
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});