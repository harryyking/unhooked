import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Modal, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Heart, Plus, MoreHorizontal } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { LegendList } from "@legendapp/list";

const { width } = Dimensions.get('window');

type ForumPost = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
  display_name: string | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { display_name: string | null };
};

type Friend = {
  id: string;
  name: string;
  streak: number;
  online: boolean;
  lastSeen: string | null;
};

const formatTime = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function AlliesScreen() {
  const [activeTab, setActiveTab] = useState<'forum' | 'friends'>('forum');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [user, setUser] = useState<any>(null);

  // Create post modal
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Comments modal
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const presenceRef = useRef<any>(null);
  const alliesSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const forumChannel = supabase.channel('forum-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_post_likes' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments' }, () => fetchPosts())
      .subscribe();

    return () => {
      supabase.removeChannel(forumChannel);
    };
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('forum_posts_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error loading posts', error.message);
    } else {
      setPosts(data || []);
    }
  };

  useEffect(() => {
    if (activeTab === 'forum') {
      fetchPosts();
    }
  }, [activeTab]);

  const fetchFriends = async () => {
    if (!user) {
      setFriends([]);
      return;
    }

    const { data: alliesData, error } = await supabase
      .from('allies')
      .select('user_id, ally_id, status')
      .or(`user_id.eq.${user.id},ally_id.eq.${user.id}`);

    if (error) {
      Alert.alert('Error loading allies', error.message);
      setFriends([]);
      return;
    }

    const friendIds = new Set<string>();
    alliesData.forEach(row => {
      if (row.status !== 'accepted') return;

      const friendId = row.user_id === user.id ? row.ally_id : row.user_id;
      if (friendId && friendId !== user.id) {
        friendIds.add(friendId);
      }
    });

    if (friendIds.size === 0) {
      setFriends([]);
      return;
    }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, current_streak')
      .in('id', Array.from(friendIds));

    const { data: checkInsData } = await supabase
      .from('check_ins')
      .select('user_id, created_at')
      .in('user_id', Array.from(friendIds))
      .order('created_at', { ascending: false });

    const lastSeenMap = new Map<string, string>();
    checkInsData?.forEach(ci => {
      if (ci.user_id && !lastSeenMap.has(ci.user_id)) {
        lastSeenMap.set(ci.user_id, ci.created_at!);
      }
    });

    const friendsList: Friend[] = (profilesData || []).map(p => ({
      id: p.id,
      name: p.display_name || 'Anonymous',
      streak: p.current_streak ?? 0,
      online: false,
      lastSeen: lastSeenMap.get(p.id) ?? null,
    }));

    friendsList.sort((a, b) => {
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      if (a.lastSeen && b.lastSeen) {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
      return b.streak - a.streak || a.name.localeCompare(b.name);
    });

    setFriends(friendsList);
  };

  useEffect(() => {
    if (activeTab === 'friends' && user) {
      fetchFriends();

      const alliesChannel = supabase.channel('allies-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'allies' }, fetchFriends)
        .subscribe();
      alliesSubscriptionRef.current = alliesChannel;

      const presenceChannel = supabase.channel('allies-presence');
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState<{ user_id: string }>();
          const onlineIds = new Set<string>();
          Object.values(state).flat().forEach(presence => {
            if (presence.user_id) onlineIds.add(presence.user_id);
          });
          setFriends(prev =>
            prev.map(f => ({
              ...f,
              online: onlineIds.has(f.id),
            }))
          );
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: user.id });
          }
        });

      presenceRef.current = presenceChannel;
    } else {
      setFriends([]);
    }

    return () => {
      if (alliesSubscriptionRef.current) {
        supabase.removeChannel(alliesSubscriptionRef.current);
        alliesSubscriptionRef.current = null;
      }
      if (presenceRef.current) {
        presenceRef.current.untrack();
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };
  }, [activeTab, user]);

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;

    let error;
    if (currentlyLiked) {
      ({ error } = await supabase
        .from('forum_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id));
    } else {
      ({ error } = await supabase
        .from('forum_post_likes')
        .insert({ post_id: postId, user_id: user.id }));
    }

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchPosts();
    }
  };

  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    const { data, error } = await supabase
      .from('forum_comments')
      .select('id, body, created_at, user_id, profiles!inner(display_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error loading comments', error.message);
    } else {
      setComments(data || []);
    }
    setNewComment('');
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedPostId || !user) return;

    const { error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: selectedPostId,
        body: newComment.trim(),
        user_id: user.id,
      });

    if (error) {
      Alert.alert('Error posting comment', error.message);
    } else {
      setNewComment('');
      openComments(selectedPostId);
      fetchPosts();
    }
  };

  const createPost = async () => {
    if (!title.trim() || !body.trim() || !user) {
      Alert.alert('Error', 'Title, body, and signed-in user are required');
      return;
    }

    const { error } = await supabase
      .from('forum_posts')
      .insert({
        title: title.trim(),
        body: body.trim(),
        user_id: user.id,
      });

    if (error) {
      Alert.alert('Error creating post', error.message);
    } else {
      setIsCreateModalVisible(false);
      setTitle('');
      setBody('');
      fetchPosts();
    }
  };

  const renderPost = ({ item }: { item: ForumPost }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.user_id}` }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>{item.display_name || 'Anonymous'}</Text>
            <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postBody}>{item.body}</Text>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleLike(item.id, item.liked_by_me)}
        >
          <Heart
            size={20}
            color={item.liked_by_me ? '#f43f5e' : 'rgba(255,255,255,0.6)'}
            fill={item.liked_by_me ? '#f43f5e' : 'transparent'}
          />
          <Text style={styles.actionText}>{item.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openComments(item.id)}
        >
          <MessageCircle size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.actionText}>{item.comments_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatarContainer}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.id}` }}
            style={styles.avatar}
          />
          {item.online && <View style={styles.onlineDot} />}
        </View>
        <View>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendStatus}>
            {item.online ? 'Online now' : item.lastSeen ? `Last seen ${formatTime(item.lastSeen)}` : ''}
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
          <Text variant="h2">Community</Text>
          <TouchableOpacity>
            <Text style={styles.rulesLink}>Rules</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
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

        {/* Conditional LegendList to fix type issues */}
        {activeTab === 'forum' ? (
          <LegendList<ForumPost>
            data={posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            recycleItems
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
              </View>
            )}
          />
        ) : (
          <LegendList<Friend>
            data={friends}
            renderItem={renderFriend}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            recycleItems
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No allies yet. Connect with partners to see their streaks.
                </Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>

      {/* FAB - only on forum tab */}
      {activeTab === 'forum' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Plus size={32} color="#000" />
        </TouchableOpacity>
      )}

      {/* Create Post Modal */}
      <Modal visible={isCreateModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#020617'  }}>
        <KeyboardAvoidingView
          style={{ flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={{ flex: 1, padding: 24, paddingTop: 20 }}>
              <Text variant="h2" style={{ color: '#FFF', marginBottom: 24 }}>
                New Post
              </Text>

              <TextInput
                placeholder="Title"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <TextInput
                placeholder="Share your thoughts..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={body}
                onChangeText={setBody}
                multiline
                style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 }}>
                <TouchableOpacity
                  onPress={() => {
                    setIsCreateModalVisible(false);
                    setTitle('');
                    setBody('');
                  }}
                >
                  <Text style={{ color: '#f43f5e', fontSize: 18 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={createPost}>
                  <Text style={{ color: '#10b981', fontSize: 18 }}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
        </KeyboardAvoidingView>
          </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={!!selectedPostId} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setSelectedPostId(null);
                setComments([]);
                setNewComment('');
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 18 }}>Back</Text>
            </TouchableOpacity>
            <Text variant="h2" style={{ color: '#FFF' }}>
              Comments
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            renderItem={({ item: comment }) => (
              <View style={styles.commentCard}>
                <View style={styles.userInfo}>
                  <Image
                    source={{ uri: `https://i.pravatar.cc/150?u=${comment.user_id}` }}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={styles.userName}>
                      {comment.profiles?.display_name || 'Anonymous'}
                    </Text>
                    <Text style={styles.timestamp}>{formatTime(comment.created_at)}</Text>
                  </View>
                </View>
                <Text style={styles.postBody}>{comment.body}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          />

          <View style={styles.commentInputContainer}>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.commentInput}
            />
            <TouchableOpacity onPress={addComment} disabled={!newComment.trim()}>
              <Text
                style={{
                  color: newComment.trim() ? '#10b981' : 'rgba(255,255,255,0.4)',
                  fontSize: 16,
                  marginLeft: 12,
                }}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    marginBottom: 24,
  },
  rulesLink: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
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
    color: 'rgba(255,255,255,0.6)',
  },
  activeTabText: {
    color: '#020617',
  },

  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
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
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  postTitle: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 8,
  },
  postBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
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
  },

  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  friendAvatarContainer: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#020617',
  },
  friendName: {
    color: '#FFF',
    fontSize: 16,
  },
  friendStatus: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
  },

  fab: {
    position: 'absolute',
    bottom: 96,
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

  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },

  commentCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});