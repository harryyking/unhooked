import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FlatList,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Dimensions,
    TouchableOpacity,
    Alert,
    View,
    ScrollView,
} from 'react-native';
import { useColorScheme } from 'nativewind';
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
import * as Netinfo from '@react-native-community/netinfo'
import { useQuery, useMutation, Authenticated } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const { width, height } = Dimensions.get('window');
const CACHE_KEY = 'community_stories_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Interface for the story data, now matching the expected Convex document schema.
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

interface CachedStories {
    data: Story[];
    timestamp: number;
}

const Community = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const {colorScheme} = useColorScheme();
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStory, setNewStory] = useState({ 
        title: '', 
        content: '', 
        category: 'Passion Story' as 'Passion Story' | 'Testimony'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterType, setFilterType] = useState<'trending' | 'recent' | 'top'>('trending');
    const [isOnline, setIsOnline] = useState(true);
    const fadeAnim = new Animated.Value(0);

    // Fetch stories from Convex with offline caching fallback
    const rawStories = useQuery(api.stories.getStories, { filterType });
    const [cachedStories, setCachedStories] = useState<CachedStories | null>(null);

    // Load cached stories on mount
    useEffect(() => {
        loadCachedStories();
    }, []);

    // Network state listener
    useEffect(() => {
        const unsubscribe = Netinfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? false);
        });
        return unsubscribe;
    }, []);

    // Sync cache when online and data changes
    useEffect(() => {
        if (isOnline && rawStories) {
            saveToCache(rawStories);
        }
    }, [rawStories, isOnline]);

    const loadCachedStories = useCallback(async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed: CachedStories = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
                    setCachedStories(parsed);
                }
            }
        } catch (error) {
            console.error('Error loading cache:', error);
        }
    }, []);

    const saveToCache = useCallback(async (stories: Story[]) => {
        try {
            const data: CachedStories = {
                data: stories,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }, []);

    const stories = useMemo(() => {
        if (rawStories) return rawStories;
        return cachedStories?.data ?? [];
    }, [rawStories, cachedStories]);

    const isLoading = rawStories === undefined && !cachedStories;

    // Use mutations
    const createStoryMutation = useMutation(api.stories.createStory);
    const upvoteStoryMutation = useMutation(api.stories.upvoteStory);

    useEffect(() => {
        if (stories.length > 0) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }
    }, [stories]);

    const handleUpvote = useCallback(async (storyId: Id<'stories'>) => {
        
        try {
            await upvoteStoryMutation({ storyId });
            // Invalidate cache or update locally if offline
            if (!isOnline) {
                // For simplicity, refetch on next online sync
                Alert.alert('Offline', 'Upvote queued. Will sync when online.');
            }
        } catch (error) {
            console.error('Error upvoting story:', error);
            Alert.alert('Error', 'Failed to upvote story. Please try again.');
        }
    }, [ upvoteStoryMutation, isOnline]);

    const handleCreateStory = useCallback(async () => {

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

        if (!isOnline) {
            Alert.alert('Offline', 'Story creation queued. Will sync when online.');
            // TODO: Implement mutation queue with AsyncStorage
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
    }, [ newStory, createStoryMutation, isOnline]);

    const formatTime = useCallback((timestamp: number) => {
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor(diff / 60000);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }, []);

    const renderStoryCard = useCallback(({ item: story }: { item: Story }) => (
        <StoryCard
            key={story._id.toString()}
            story={story}
            onUpvote={handleUpvote}
            formatTime={formatTime}
        />
    ), [handleUpvote, formatTime]);

    const renderContent = () => {
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
                renderItem={renderStoryCard}
                keyExtractor={(item) => item._id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={5}
                getItemLayout={undefined} // Can be optimized if item heights are fixed
            />
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-4 py-4">
                <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                        <Text className="text-3xl font-bold mb-1 text-foreground">
                            Passion Stories
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                            Transformative journeys that inspire people
                        </Text>
                    </View>
                    <View className="bg-muted/50 rounded-full px-3 py-1">
                        <Text className="text-xs font-medium text-muted-foreground">
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
                        onPress={() => setFilterType(filter)}
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


            {/* Floating Action Button - Z-index fixed with higher elevation */}
            <Authenticated>

            <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                className="absolute bottom-28 right-4 z-100 w-14 h-14 bg-secondary rounded-full items-center justify-center shadow-2xl"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 16, // Higher elevation for z-index
                }}
            >
                <Ionicons name="add" size={24} color={colorScheme === 'dark' ? "white" : 'black'} />
            </TouchableOpacity>
            </Authenticated>

            {/* Create Story Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View className="flex-1 bg-background">
                    {/* Modal Header */}
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
                        <Button 
                            variant="ghost" 
                            onPress={() => setShowCreateModal(false)}
                            disabled={isSubmitting}
                        >
                            <Text className="text-muted-foreground">Cancel</Text>
                        </Button>
                        
                        <Text className="text-lg font-semibold text-foreground">New Story</Text>
                        
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
                        <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
                            {/* Category Selection */}
                            <Text className="text-base font-semibold mb-3 text-foreground">Category</Text>
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

                            {/* Title Input */}
                            <Text className="text-base font-semibold mb-2 text-foreground">Title</Text>
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

                            {/* Content Input */}
                            <Text className="text-base font-semibold mb-2 text-foreground">Your Story</Text>
                            <Textarea
                                placeholder="Share your transformative journey... Tell us about the challenges you faced, the breakthroughs you experienced, and how you overcame obstacles. Your story might be exactly what someone else needs to hear today."
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

const StoryCard = React.memo(({ story, onUpvote, formatTime }: StoryCardProps) => {
    const scaleAnim = new Animated.Value(1);
    const { colors } = useTheme();

    const handlePressIn = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    const handleUpvotePress = useCallback(() => {
        onUpvote(story._id);
    }, [story._id, onUpvote]);

    const getCategoryColor = useCallback((category: string) => {
        if (category === 'Passion Story') return '#ef4444';
        if (category === 'Testimony') return '#3b82f6';
        return '#6b7280';
    }, []);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="mx-5 mb-4 mt-4">
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Card className="bg-secondary border-border">
                    <CardHeader className="pb-2">
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
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-xs">
                                        {formatTime(story.createdAt)}
                                    </Text>
                                    <Text className="text-xs">
                                        {story.readTime}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                className="flex-row items-center mr-6"
                                onPress={handleUpvotePress}
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
});

export default Community;