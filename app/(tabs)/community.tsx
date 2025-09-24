import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Animated,
    RefreshControl,
    Dimensions,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {debounce} from 'lodash';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { Id } from '@/convex/_generated/dataModel';

const { width, height } = Dimensions.get('window');

// Interface for the story data
interface Story {
    _id: Id<'stories'>;
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

const ITEMS_PER_PAGE = 10;

const Community = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { isSignedIn } = useAuth();
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStory, setNewStory] = useState({ 
        title: '', 
        content: '', 
        category: 'Passion Story' as 'Passion Story' | 'Testimony'
    });
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState<'trending' | 'recent' | 'top'>('trending');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(0);
    const [cachedStories, setCachedStories] = useState<Story[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const fadeAnim = new Animated.Value(0);

    // Fetch stories with pagination
    const rawStories = useQuery(api.stories.getStories, { 
        filterType, 
    });
    const stories = rawStories ?? cachedStories;
    const isLoading = rawStories === undefined && cachedStories.length === 0;

    // Mutations
    const createStoryMutation = useMutation(api.stories.createStory);
    const upvoteStoryMutation = useMutation(api.stories.upvoteStory);

    // Load cached stories
    useEffect(() => {
        const loadCachedStories = async () => {
            try {
                const cached = await AsyncStorage.getItem(`stories_${filterType}_${page}`);
                if (cached) {
                    setCachedStories(JSON.parse(cached));
                } else {
                    setCachedStories([]);
                }
            } catch (err) {
                console.error('Error loading cached stories:', err);
                setError('Failed to load cached stories.');
            }
        };
        loadCachedStories();
    }, [filterType, page]);

    // Cache stories when fetched
    useEffect(() => {
        if (rawStories) {
            AsyncStorage.setItem(`stories_${filterType}_${page}`, JSON.stringify(rawStories)).catch((err) =>
                console.error('Error caching stories:', err)
            );
            setCachedStories(rawStories);
            setError(null);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }
    }, [rawStories, filterType, page]);

    // Offline detection
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: any) => {
            setIsOffline(!state.isConnected);
            if (!state.isConnected && cachedStories.length > 0) {
                Alert.alert('Offline', 'Showing cached stories. Connect to the internet for updates.');
            }
        });
        return () => unsubscribe();
    }, [cachedStories]);

    // Debounced filter change
    const debouncedSetFilterType = useMemo(
        () => debounce((filter: 'trending' | 'recent' | 'top') => {
            setFilterType(filter);
            setPage(0); // Reset page when filter changes
        }, 300),
        []
    );

    const handleUpvote = async (storyId: Id<'stories'>) => {
        if (!isSignedIn) {
            Alert.alert('Sign In Required', 'Please sign in to upvote stories.');
            return;
        }
        
        try {
            await upvoteStoryMutation({ storyId });
        } catch (error) {
            console.error('Error upvoting story:', error);
            Alert.alert('Error', 'Failed to upvote story. Please try again.');
        }
    };

    const handleCreateStory = async () => {
        if (!isSignedIn) {
            Alert.alert('Sign In Required', 'Please sign in to create stories.');
            return;
        }

        if (!newStory.title.trim() || !newStory.content.trim()) {
            Alert.alert('Validation Error', 'Please fill in both title and content');
            return;
        }

        if (newStory.title.length > 100) {
            Alert.alert('Validation Error', 'Title must be less than 100 characters');
            return;
        }

        if (newStory.content.length < 50) {
            Alert.alert('Validation Error', 'Content must be at least 50 characters long');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const wordCount = newStory.content.trim().split(/\s+/).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' min read';

            await createStoryMutation({
                title: newStory.title.trim(),
                content: newStory.content.trim(),
                category: newStory.category,
                readTime: readTime,
            });

            setNewStory({ title: '', content: '', category: 'Passion Story' });
            setShowCreateModal(false);
            Alert.alert('Success', 'Your story has been published!');
        } catch (error) {
            console.error('Error creating story:', error);
            Alert.alert('Error', 'Failed to create story. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            setPage(0); // Reset to first page
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
        } catch (error) {
            console.error('Error refreshing stories:', error);
            setError('Failed to refresh stories.');
        } finally {
            setRefreshing(false);
        }
    };

    const loadMore = useCallback(() => {
        if (rawStories && rawStories.length === ITEMS_PER_PAGE) {
            setPage((prev) => prev + 1);
        }
    }, [rawStories]);

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor(diff / 60000);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const renderContent = () => {
        if (error && stories.length === 0) {
            return (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="alert-circle-outline" size={64} color={colors.border} />
                    <Text className="text-muted-foreground text-center mt-4 text-base">
                        {error}
                    </Text>
                    <Button onPress={onRefresh} className="mt-4" size="sm">
                        <Text>Retry</Text>
                    </Button>
                </View>
            );
        }

        if (isLoading) {
            return (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-muted-foreground text-center">Loading stories...</Text>
                </View>
            );
        }
        
        if (stories.length === 0) {
            return (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="book-outline" size={64} color={colors.border} />
                    <Text className="text-muted-foreground text-center mt-4 text-base">
                        No stories found. Be the first to share your journey!
                    </Text>
                    <Button 
                        onPress={() => setShowCreateModal(true)}
                        className="mt-4"
                        size="sm"
                    >
                        <Text>Share Your Story</Text>
                    </Button>
                </View>
            );
        }
        
        return (
            <FlatList
                data={stories}
                renderItem={({ item }) => (
                    <StoryCard
                        story={item}
                        onUpvote={handleUpvote}
                        formatTime={formatTime}
                    />
                )}
                keyExtractor={(item) => item._id.toString()}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListFooterComponent={<View style={{ height: 100 }} />}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    return (
        <SafeAreaView className="flex-1">
            <View className='px-4 py-8'>
                <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                        <Text className="text-2xl font-bold mb-1">
                            Passion Stories
                        </Text>
                        <Text className="text-sm">
                            Transformative journeys that inspire people
                        </Text>
                    </View>
                    <View className="bg-white/20 rounded-full px-3 py-1">
                        <Text className="text-xs font-medium">
                            {stories.length} stories
                        </Text>
                    </View>
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-5 pb-4 border-b border-border">
                {(['trending', 'recent', 'top'] as const).map((filter) => (
                    <Button
                        key={filter}
                        variant={filterType === filter ? 'default' : 'ghost'}
                        size="sm"
                        className="mr-3"
                        onPress={() => debouncedSetFilterType(filter)}
                    >
                        <Text className={filterType === filter ? 'text-primary-foreground' : 'text-muted-foreground'}>
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                    </Button>
                ))}
            </View>

            <Animated.View className="flex-1" style={{ opacity: fadeAnim }}>
                {renderContent()}
            </Animated.View>

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                className="absolute bottom-6 right-5 w-14 h-14 bg-secondary rounded-full items-center justify-center shadow-lg"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>

            {/* Create Story Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View className="flex-1 bg-background">
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
                        <Button 
                            variant="ghost" 
                            onPress={() => setShowCreateModal(false)}
                            disabled={isSubmitting}
                        >
                            <Text className="text-muted-foreground">Cancel</Text>
                        </Button>
                        <Text className="text-lg font-semibold">New Story</Text>
                        <Button 
                            variant="ghost" 
                            onPress={handleCreateStory}
                            disabled={isSubmitting || !newStory.title.trim() || !newStory.content.trim()}
                        >
                            <Text className={`font-semibold ${
                                isSubmitting || !newStory.title.trim() || !newStory.content.trim() 
                                    ? 'text-muted-foreground' 
                                    : 'text-primary'
                            }`}>
                                {isSubmitting ? 'Publishing...' : 'Publish'}
                            </Text>
                        </Button>
                    </View>

                    <KeyboardAvoidingView
                        className="flex-1"
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <ScrollView className="flex-1 px-5 py-6">
                            <Text className="text-base font-semibold mb-3">Category</Text>
                            <View className="flex-row mb-6">
                                {(['Passion Story', 'Testimony'] as const).map((category) => (
                                    <Button
                                        key={category}
                                        variant={newStory.category === category ? 'default' : 'outline'}
                                        size="sm"
                                        className="mr-3"
                                        onPress={() => setNewStory(prev => ({ ...prev, category }))}
                                    >
                                        <Text className={
                                            newStory.category === category 
                                                ? 'text-primary-foreground' 
                                                : 'text-foreground'
                                        }>
                                            {category}
                                        </Text>
                                    </Button>
                                ))}
                            </View>

                            <Text className="text-base font-semibold mb-2">Title</Text>
                            <Input
                                placeholder="Give your story a compelling title..."
                                value={newStory.title}
                                onChangeText={(text) => setNewStory(prev => ({ ...prev, title: text }))}
                                className="mb-6"
                                maxLength={100}
                            />
                            <Text className="text-xs text-muted-foreground mb-6 -mt-4">
                                {newStory.title.length}/100 characters
                            </Text>

                            <Text className="text-base font-semibold mb-2">Your Story</Text>
                            <Textarea
                                placeholder="Share your transformative journey..."
                                value={newStory.content}
                                onChangeText={(text) => setNewStory(prev => ({ ...prev, content: text }))}
                                className="min-h-[200px]"
                                multiline
                                textAlignVertical="top"
                            />
                            <View className="flex-row justify-between mt-2">
                                <Text className="text-xs text-muted-foreground">
                                    {newStory.content.length} characters
                                </Text>
                                <Text className="text-xs text-muted-foreground">
                                    ~{Math.max(1, Math.ceil(newStory.content.trim().split(/\s+/).length / 200))} min read
                                </Text>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

interface StoryCardProps {
    story: Story;
    onUpvote: (storyId: Id<'stories'>) => Promise<void>;
    formatTime: (timestamp: number) => string;
}

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

    const getCategoryColor = (category: string) => {
        if (category === 'Passion Story') return '#ef4444';
        if (category === 'Testimony') return '#3b82f6';
        return '#6b7280';
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginHorizontal: 20, marginVertical: 8 }}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => { /* Add navigation to story details here */ }}
            >
                <Card className="bg-secondary border border-border">
                    <CardHeader>
                        <View className="flex-col justify-between items-start">
                            <Badge 
                                variant="secondary" 
                                className='mb-2'
                                style={{ backgroundColor: getCategoryColor(story.category) }}
                            >
                                <Text className="text-white text-xs font-medium">
                                    {story.category}
                                </Text>
                            </Badge>
                            <CardTitle className="text-lg font-bold text-foreground leading-6">
                                {story.title}
                            </CardTitle>
                        </View>
                    </CardHeader>
                    <CardContent className="py-0">
                        <Text className='text-sm text-muted-foreground leading-5' numberOfLines={3}>
                            {story.content}
                        </Text>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <View className="flex-row items-center w-full">
                            <View className="mr-auto">
                                <Text className="text-sm text-foreground">{story.author}</Text>
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-xs text-muted-foreground">
                                        {formatTime(story.createdAt)}
                                    </Text>
                                    <Text className="text-xs text-muted-foreground">
                                        {story.readTime}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                className="flex-row items-center mr-6"
                                onPress={() => onUpvote(story._id)}
                            >
                                <Ionicons
                                    name={story.hasUpvoted ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={story.hasUpvoted ? '#ef4444' : colors.text}
                                />
                                <Text 
                                    className="ml-1.5 text-sm font-medium"
                                    style={{ color: story.hasUpvoted ? '#ef4444' : colors.text }}
                                >
                                    {story.upvotes}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </CardFooter>
                </Card>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default Community;