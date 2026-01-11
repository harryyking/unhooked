import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Headphones,
  PlayCircle,
  FileText,
  Clock,
  Lock,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// --- UI Components ---
import { Text } from '@/components/ui/text';

const { width } = Dimensions.get('window');

// Data for the top grid
const CATEGORIES = [
  { id: '1', label: 'Articles', color: '#0369a1', icon: <FileText size={20} color="#FFF" /> },
  { id: '2', label: 'Videos', color: '#f43f5e', icon: <PlayCircle size={20} color="#FFF" /> },
  { id: '3', label: 'Podcast', color: '#0f766e', icon: <Headphones size={20} color="#FFF" /> },
  { id: '4', label: 'Books', color: '#172554', icon: <BookOpen size={20} color="#FFF" /> },
];

// Data for the course list
const COURSES = [
  {
    id: 'c1',
    title: 'Understanding The Problem',
    type: 'Introductory Course',
    duration: '6 min',
    isLocked: false,
    description:
      'An introduction to the core problem of addiction from both a scientific and biblical perspective. Learn why this struggle exists and why it affects so many.',
  },
  {
    id: 'c2',
    title: 'Causes of Addiction',
    type: 'Neurology Basics',
    duration: '8 min',
    isLocked: false,
    description:
      'Explore the neurological foundations of addiction. Understand dopamine pathways, habit formation, and how the brain rewires itself in response to compulsive behaviors.',
  },
  {
    id: 'c3',
    title: 'The Spiritual Battle',
    type: 'Theology 101',
    duration: '12 min',
    isLocked: true,
    description:
      'This content is locked. Complete the previous courses to unlock deeper theological insights into the spiritual dimensions of freedom and victory.',
  },
];

export default function LearnScreen() {
  const navigation = useNavigation<any>();

  // Modal state for Start Here courses
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Navigate to category screens (assume these screens exist: ArticlesScreen, VideosScreen, etc.)
  const handleCategoryPress = (label: string) => {
    const screenMap: { [key: string]: string } = {
      Articles: 'Articles',
      Videos: 'Videos',
      Podcast: 'Podcasts',
      Books: 'Books',
    };
    const screenName = screenMap[label];
    if (screenName) {
      navigation.navigate(screenName);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. Header */}
          <View style={styles.header}>
            <Text variant={'h2'}>Learn</Text>
          </View>

          {/* 2. Category Grid */}
          <View style={styles.gridContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.gridItem, { backgroundColor: cat.color }]}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(cat.label)}
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
                  <View style={[styles.dot, index === 0 ? styles.dotOrange : styles.dotGrey]} />
                  {index < COURSES.length - 1 && <View style={styles.verticalLine} />}
                  {index === COURSES.length - 1 && <View style={styles.dotGrey} />}
                </View>

                {/* Course Card */}
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => setSelectedCourse(course)}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      {course.isLocked && <Lock size={18} color="rgba(255,255,255,0.5)" />}
                    </View>
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

      {/* Course Content Modal */}
      <Modal
        visible={!!selectedCourse}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCourse(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: '#020617' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedCourse(null)}>
                <X size={28} color="#FFF" />
              </TouchableOpacity>
              <Text variant="h2" style={{ color: '#FFF' }}>
                {selectedCourse?.title}
              </Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedCourse?.isLocked ? (
                <View style={styles.lockedContainer}>
                  <Lock size={64} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.lockedText}>This lesson is locked</Text>
                  <Text style={styles.lockedSubtext}>
                    Complete previous courses to unlock this content.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.modalType}>{selectedCourse?.type}</Text>
                  <View style={styles.modalMeta}>
                    <Clock size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.modalDuration}>{selectedCourse?.duration}</Text>
                  </View>

                  <View style={styles.contentPlaceholder}>
                    <Text style={styles.contentText}>{selectedCourse?.description}</Text>
                    {/* Placeholder for real content (video, article, etc.) */}
                    <Text style={styles.placeholderNote}>
                      Full lesson content (video/text) will be displayed here.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
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

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  gridItem: {
    width: (width - 48 - 12) / 2,
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
    fontSize: 16,
  },

  // Section Header
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#FFF',
  },

  // Course List
  courseList: {
    gap: 24,
  },
  courseRow: {
    flexDirection: 'row',
    minHeight: 140,
  },

  // Timeline Visuals
  timelineContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOrange: {
    backgroundColor: '#f97316',
  },
  dotGrey: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 8,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#0c2b45',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardContent: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseTitle: {
    fontSize: 20,
    color: '#FFF',
    lineHeight: 28,
    flex: 1,
  },
  courseType: {
    fontSize: 14,
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
    color: 'rgba(255,255,255,0.5)',
  },

  // Modal Styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  modalDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  contentPlaceholder: {
    gap: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
  },
  placeholderNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 80,
    gap: 24,
  },
  lockedText: {
    fontSize: 24,
    color: '#FFF',
  },
  lockedSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});