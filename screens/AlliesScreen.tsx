import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Heart, Plus, MoreHorizontal, User, Circle } from 'lucide-react-native';

// --- UI Components ---
import { Text } from '@/components/ui/text';

const { width } = Dimensions.get('window');

// 1. Define distinct types for your two data structures
type ForumPost = {
  id: string;
  user: string;
  avatar: string;
  time: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  liked: boolean;
};

type Friend = {
  id: string;
  name: string;
  status: string;
  streak: number;
};

// 2. Create a Union Type for the FlatList
type CommunityItem = ForumPost | Friend;


// --- Mock Data: Forum ---
const FORUM_POSTS: ForumPost[] = [
  {
    id: '1',
    user: 'David_Walker',
    avatar: 'https://i.pravatar.cc/150?u=1',
    time: '2 hrs ago',
    title: '37 days! God is so good.',
    body: 'I honestly didn’t think I could make it past the first week. The "Emergency Exit" button saved me twice yesterday.',
    likes: 24,
    comments: 5,
    liked: true,
  },
  {
    id: '2',
    user: 'SarahFaith',
    avatar: 'https://i.pravatar.cc/150?u=2',
    time: '4 hrs ago',
    title: 'Need prayers for tonight.',
    body: 'Evenings are my hardest time. Feeling lonely but trying to stay in the word.',
    likes: 12,
    comments: 8,
    liked: false,
  },
  {
    id: '3',
    user: 'Mike_Recovering',
    avatar: 'https://i.pravatar.cc/150?u=3',
    time: '1 day ago',
    title: 'The brain fog is finally lifting!',
    body: 'Just wanted to share a win. I woke up with actual energy today. Keep going everyone.',
    likes: 45,
    comments: 12,
    liked: false,
  },
];

// --- Mock Data: Friends ---
const FRIENDS = [
  { id: 'f1', name: 'John Doe', status: 'online', streak: 12 },
  { id: 'f2', name: 'Pastor Mike', status: 'offline', streak: 450 },
  { id: 'f3', name: 'Accountability Group A', status: 'online', streak: 5 },
];

export default function AlliesScreen() {
  const [activeTab, setActiveTab] = useState<'forum' | 'friends'>('forum');

  // --- Render Item: Forum Post ---
  const renderPost = ({ item }: { item: typeof FORUM_POSTS[0] }) => (
    <View style={styles.card}>
      {/* Header: User Info */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{item.user}</Text>
            <Text style={styles.timestamp}>{item.time}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postBody}>{item.body}</Text>

      {/* Footer: Actions */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Heart 
            size={20} 
            color={item.liked ? '#f43f5e' : 'rgba(255,255,255,0.6)'} 
            fill={item.liked ? '#f43f5e' : 'transparent'}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Render Item: Friend Row ---
  const renderFriend = ({ item }: { item: typeof FRIENDS[0] }) => (
    <TouchableOpacity style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatarPlaceholder}>
          <User size={20} color="#FFF" />
          {/* Online Dot */}
          {item.status === 'online' && <View style={styles.onlineDot} />}
        </View>
        <View>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendStatus}>
            {item.status === 'online' ? 'Online now' : 'Last seen 2h ago'}
          </Text>
        </View>
      </View>
      <View style={styles.streakBadge}>
        <Text style={styles.streakText}>{item.streak}d</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
    

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Community</Text>
          <TouchableOpacity>
            <Text style={styles.rulesLink}>Rules</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'forum' && styles.activeTab]}
            onPress={() => setActiveTab('forum')}
          >
            <Text style={[styles.tabText, activeTab === 'forum' && styles.activeTabText]}>
              Forum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        <FlatList<CommunityItem>
          data={activeTab === 'forum' ? FORUM_POSTS : FRIENDS}
          renderItem={activeTab === 'forum' ? renderPost : renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No friends added yet.</Text>
            </View>
          }
        />
      </SafeAreaView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
        <Plus size={32} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 , backgroundColor: '#020617'},
  safeArea: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 32,
    fontFamily: 'Serif-Bold',
    color: '#FFF',
  },
  rulesLink: {
    fontSize: 16,
    fontFamily: 'Sans-Regular',
    color: 'rgba(255,255,255,0.6)',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Sans-Medium',
    color: 'rgba(255,255,255,0.6)',
  },
  activeTabText: {
    color: '#020617', // Dark color for contrast on white
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for FAB
    gap: 16,
  },

  // Forum Card Style
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Sans-SemiBold',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: 'Sans-Regular',
  },
  postTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Serif-SemiBold',
    marginBottom: 8,
  },
  postBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontFamily: 'Sans-Regular',
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'Sans-Medium',
  },

  // Friend Card Style
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981', // Green
    borderWidth: 2,
    borderColor: '#020617',
  },
  friendName: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Sans-Medium',
  },
  friendStatus: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)', // Amber tint
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    color: '#f59e0b', // Amber text
    fontSize: 12,
    fontWeight: 'bold',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Sans-Regular',
  }
});