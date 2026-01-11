import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';

const VERSES = [
  '2+corinthians+5:17',      // New creation in Christ
  'ephesians+2:10',          // God's workmanship
  '1+peter+2:9',             // Chosen people, royal priesthood
  'romans+8:1',              // No condemnation in Christ
  'galatians+2:20',          // Crucified with Christ, live by faith
  'psalm+139:13-14',         // Fearfully and wonderfully made
  '1+corinthians+6:18-20',   // Body is temple of Holy Spirit
  '1+corinthians+10:13',     // God provides a way out of temptation
  'philippians+4:8',         // Think on whatever is pure
  'romans+6:12-14',          // Do not let sin reign
  '2+timothy+2:22',          // Flee youthful lusts, pursue righteousness
  'matthew+5:28-29',         // Lust in the heart / radical measures
  'psalm+119:11',            // Hidden Your word in my heart that I might not sin
  'james+1:14-15',           // Temptation and sin process
  'romans+12:2',             // Renewing of the mind
  'ephesians+4:22-24',       // Put off old self, put on new self
  'colossians+3:5',          // Put to death sexual immorality
  '1+thessalonians+4:3-5',   // God's will: sexual purity
  'hebrews+4:15-16',         // Jesus sympathizes, approach throne of grace
  '1+john+1:9',              // Confess sins, He forgives and cleanses
  'proverbs+4:23',           // Guard your heart
  'psalm+51:10',             // Create in me a clean heart
  'isaiah+41:10',            // Fear not, I am with you
  'jeremiah+29:11',          // Plans to prosper you
  'philippians+4:13',        // I can do all things through Christ
  'romans+8:37-39',          // More than conquerors, nothing separates from God's love
  'zephaniah+3:17',          // The Lord delights in you
  'ephesians+1:4-5',         // Chosen, adopted, accepted
  'john+1:12',               // Children of God
  'song+of+songs+4:7',       // You are altogether beautiful (God's view)
];

const FALLBACK_VERSE = {
  text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
  reference: "2 Corinthians 5:17 (KJV)",
};

const BibleVerse = () => {
  const [verse, setVerse] = useState(FALLBACK_VERSE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyVerse = async () => {
      try {
        setLoading(true);

        // Deterministic daily selection based on date (same verse for all users each day)
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        const index = (dayOfYear - 1) % VERSES.length;
        const reference = VERSES[index];

        // Fetch KJV for classic, uplifting language
        const response = await fetch(`https://bible-api.com/${reference}`);
        
        if (!response.ok) {
          throw new Error('API response not ok');
        }

        const data = await response.json();

        let verseText = data.text;
        if (!verseText && data.verses) {
          verseText = data.verses.map((v: any) => v.text.trim()).join(' ');
        }

        if (verseText && data.reference) {
          setVerse({
            text: verseText.trim(),
            reference: `${data.reference}`,
          });
        }
      } catch (error) {
        console.error("Error fetching daily verse:", error);
        setVerse(FALLBACK_VERSE);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyVerse();
  }, []);

  return (
    <View style={styles.verseSection}>
      <Text style={styles.verseTag}>DAILY VERSE</Text>
      
      {loading ? (
        <ActivityIndicator color="#6366f1" style={{ marginVertical: 10 }} />
      ) : (
        <>
          <Text style={styles.verseBody}>
            "{verse.text}"
          </Text>
          <Text style={styles.verseReference}>{verse.reference}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  verseSection: {
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  verseTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 1.5,
    marginBottom: 12,
    fontFamily: 'Sans-Bold'
  },
  verseBody: {
    fontSize: 18,
    lineHeight: 26,
    color: '#F8FAFC',
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'Sans-Regular'
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    fontFamily: 'Sans-Regular'
  },
});

export default BibleVerse;