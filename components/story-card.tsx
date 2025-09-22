import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@react-navigation/native';

// Interfaces for props
interface Story {
  _id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: number;
  upvotes: number;
  comments: number;
  author: string;
  category: 'Passion Story' | 'Testimony';
  readTime: string;
  hasUpvoted: boolean;
}

interface StoryCardProps {
  story: Story;
  onUpvote: (storyId: string) => void;
  formatTime: (timestamp: number) => string;
}

const getCategoryColor = (category: Story['category']) => {
  if (category === 'Passion Story') return '#ef4444';
  if (category === 'Testimony') return '#3b82f6';
  return '#6b7280';
};

const StoryCard = ({ story, onUpvote, formatTime }: StoryCardProps) => {
  const scaleAnim = new Animated.Value(1);
  const { colors } = useTheme();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => { /* Add navigation here */ }}
      >
        <Card style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
          <CardHeader>
            <View style={styles.storyHeader}>
              <View style={styles.authorInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{story.author[0]}</Text>
                </View>
                <View style={styles.authorDetails}>
                  <Text style={[styles.authorName, { color: colors.text }]}>{story.author}</Text>
                  <View style={styles.metaInfo}>
                    <Text style={[styles.timeText, { color: colors.border }]}>{formatTime(story.createdAt)}</Text>
                    <Text style={[styles.separator, { color: colors.border }]}>•</Text>
                    <Text style={[styles.readTime, { color: colors.border }]}>{story.readTime}</Text>
                  </View>
                </View>
              </View>
              <Badge variant="secondary" style={{ backgroundColor: getCategoryColor(story.category) }}>
                <Text style={styles.categoryText}>{story.category}</Text>
              </Badge>
            </View>
          </CardHeader>

          <CardContent>
            <CardTitle style={[styles.storyTitle, { color: colors.text }]}>{story.title}</CardTitle>
            <CardDescription style={[styles.storyContent, { color: colors.border }]} numberOfLines={3}>
              {story.content}
            </CardDescription>
          </CardContent>

          <CardFooter>
            <View style={styles.storyFooter}>
              <TouchableOpacity
                style={styles.upvoteButton}
                onPress={() => onUpvote(story._id)}
              >
                <Ionicons
                  name={story.hasUpvoted ? 'heart' : 'heart-outline'}
                  size={20}
                  color={story.hasUpvoted ? '#ef4444' : colors.border}
                />
                <Text style={[styles.upvoteText, { color: story.hasUpvoted ? '#ef4444' : colors.border }]}>
                  {story.upvotes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commentButton}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.border} />
                <Text style={[styles.commentText, { color: colors.border }]}>{story.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={18} color={colors.border} />
              </TouchableOpacity>
            </View>
          </CardFooter>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Styles for the StoryCard are defined here
const styles = StyleSheet.create({
  // ... (all the styles related to the StoryCard)
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  readTime: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  storyContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  storyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  upvoteText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  commentText: {
    marginLeft: 6,
    fontSize: 14,
  },
  shareButton: {
    marginLeft: 'auto',
  },
});

export default StoryCard;