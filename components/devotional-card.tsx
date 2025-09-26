import { StyleSheet, View, Dimensions } from 'react-native';
import { Text } from './ui/text';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimerCard } from './prayer-card';

const { width } = Dimensions.get('window');

interface DailyVerse {
  verse: string;
  reference: string;
}

const DevotionalCard: React.FC = () => {
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Convex action hook
  const getDailyVerse = useAction(api.devotional.getDailyVerseForUser);

  // Fetch daily verse on component mount, with caching
  useEffect(() => {
    const loadDailyVerse = async () => {
      const cacheKey = 'dailyVerse';
      const today = new Date().toISOString().split('T')[0];

      try {
        setHasError(false);

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
        const verseData = await getDailyVerse();

        // Validate the response
        if (!verseData?.verse || !verseData?.reference) {
          throw new Error('Invalid verse data received');
        }

        // Cache the new data
        const cacheData = { ...verseData, date: today };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

        setDailyVerse(verseData);
      } catch (error) {
        console.error('Error loading daily verse:', error);
        setHasError(true);
        setDailyVerse(null);
      } finally {
        setIsLoadingVerse(false);
      }
    };

    loadDailyVerse();
  }, [getDailyVerse]);

  const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const formatVerseText = (verseContent: string): string => {
    const cleanedVerse = stripHtmlTags(verseContent);
    return cleanedVerse.replace(/^\d+\s*/, '').trim();
  };

  const formatReference = (reference: string): string => {
    const parts = reference.split('.');
    if (parts.length >= 3) {
      const bookCode = parts[0];
      const chapter = parts[1];
      const verse = parts[2];

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

    return reference;
  };

  // Loading skeleton component for professional loading state
  const LoadingSkeleton = () => (
    <Card className='mb-4 border-0 shadow-none'>
      <CardHeader className='flex-row justify-between items-center'>
        <CardTitle variant={'small'} className='text-muted-foreground'>
          DAILY REFRESH
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.skeletonContainer}>
          <View style={styles.loadingDotsContainer}>
            <View style={[styles.loadingDot, styles.dot1]} />
            <View style={[styles.loadingDot, styles.dot2]} />
            <View style={[styles.loadingDot, styles.dot3]} />
          </View>
          <Text className='text-muted-foreground text-center mt-3 text-sm'>
            Loading your daily verse...
          </Text>
        </View>
      </CardContent>
      <CardFooter>
        <View style={styles.skeletonReference} />
      </CardFooter>
    </Card>
  );

  // Return null if there's an error (hide the component completely)
  if (hasError) {
    return null;
  }

  // Show loading skeleton while loading
  if (isLoadingVerse) {
    return <LoadingSkeleton />;
  }

  // Only render if we have valid verse data
  if (!dailyVerse) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Daily Verse Card */}
      <Card className='mb-4 border-0 shadow-none'>
        <CardHeader className='flex-row justify-between items-center'>
          <CardTitle variant={'small'} className='text-muted-foreground'>
            DAILY REFRESH
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Text className='text-lg'>
            {formatVerseText(dailyVerse.verse)}
          </Text>
        </CardContent>
        <CardFooter>
          <Text className='font-medium font-mono'>
            {formatReference(dailyVerse.reference)}
          </Text>
        </CardFooter>
      </Card>


      <PrayerTimerCard dailyVerse={dailyVerse.verse}/>
    </View>
  );
};

export default DevotionalCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  skeletonContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  dot1: {},
  dot2: {},
  dot3: {},
  skeletonReference: {
    width: 80,
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
});