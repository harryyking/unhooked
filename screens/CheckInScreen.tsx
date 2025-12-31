import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Headphones, PlayCircle, FileText, Clock } from 'lucide-react-native';

// --- UI Components ---
import { Text } from '@/components/ui/text';

const { width } = Dimensions.get('window');

// Data for the top grid
const CATEGORIES = [
  { id: '1', label: 'Articles', color: '#0369a1', icon: <FileText size={20} color="#FFF" /> }, // Sky Blue
  { id: '2', label: 'Videos', color: '#f43f5e', icon: <PlayCircle size={20} color="#FFF" /> }, // Rose
  { id: '3', label: 'Podcast', color: '#0f766e', icon: <Headphones size={20} color="#FFF" /> }, // Teal
  { id: '4', label: 'Books', color: '#172554', icon: <BookOpen size={20} color="#FFF" /> }, // Deep Blue
];

// Data for the course list
const COURSES = [
  {
    id: 'c1',
    title: 'Understanding The Problem',
    type: 'Introductory Course',
    duration: '6 min',
    isLocked: false,
  },
  {
    id: 'c2',
    title: 'Causes of Addiction',
    type: 'Neurology Basics',
    duration: '8 min',
    isLocked: false,
  },
  {
    id: 'c3',
    title: 'The Spiritual Battle',
    type: 'Theology 101',
    duration: '12 min',
    isLocked: true, // Example of state
  },
];

export default function CheckInScreen() {
  return (
    <View style={styles.container}>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Learn</Text>
          </View>

          {/* 2. Category Grid */}
          <View style={styles.gridContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.gridItem, { backgroundColor: cat.color }]}
                activeOpacity={0.8}
              >
                <View style={styles.gridIconOpacity}>{cat.icon}</View>
                <Text style={styles.gridLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3. Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Start Here</Text>
          </View>

          {/* 4. Course Timeline List */}
          <View style={styles.courseList}>
            {COURSES.map((course, index) => (
              <View key={course.id} style={styles.courseRow}>
                
                {/* Visual Timeline Indicator */}
                <View style={styles.timelineContainer}>
                  <View style={styles.dotOrange} />
                  <View style={styles.verticalLine} />
                  <View style={styles.dotGrey} />
                </View>

                {/* Course Card */}
                <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                  <View style={styles.cardContent}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseType}>{course.type}</Text>
                    
                    <View style={styles.metaContainer}>
                      <Clock size={12} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.durationText}>{course.duration}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617'
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'Serif-Bold', // Assuming you have this loaded
    color: '#FFF',
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  gridItem: {
    width: (width - 48 - 12) / 2, // (Screen width - padding - gap) / 2 columns
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gridIconOpacity: {
    opacity: 0.8,
    marginRight: 8,
  },
  gridLabel: {
    color: '#FFF',
    fontFamily: 'Sans-Medium',
    fontSize: 16,
  },

  // Section Header
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#FFF',
    fontFamily: 'Sans-Bold',
  },

  // Course List
  courseList: {
    gap: 24,
  },
  courseRow: {
    flexDirection: 'row',
    height: 140, // Fixed height for the visual consistency
  },
  
  // Timeline Visuals
  timelineContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between', // Pushes dots to top/bottom
    paddingVertical: 12, // Align dots with card content padding
    marginRight: 16,
  },
  dotOrange: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f97316', // Orange-500
  },
  verticalLine: {
    width: 2,
    flex: 1, // Fill space between dots
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
    borderRadius: 1,
  },
  dotGrey: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#0c2b45', // Dark Deep Blue (matches image)
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardContent: {
    gap: 8,
  },
  courseTitle: {
    fontSize: 20,
    fontFamily: 'Serif-SemiBold',
    color: '#FFF',
    lineHeight: 28,
  },
  courseType: {
    fontSize: 14,
    fontFamily: 'Sans-Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Sans-Medium',
    color: 'rgba(255,255,255,0.5)',
  },
});