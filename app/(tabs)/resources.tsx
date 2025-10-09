import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import {
  FlatList,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  AudioPlayer,
} from 'expo-audio';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import NetInfo from '@react-native-community/netinfo';

// Convex API
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced data structure
interface Resource {
  _id: Id<'resources'>;
  _creationTime: number;
  title: string;
  description?: string;
  url: string | null;
  storageId: Id<'_storage'>;
  duration?: number;
  playCount?: number;
  isBookmarked?: boolean;
}

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  position: number;
  duration: number;
  playbackRate: number;
  isBuffering: boolean;
  error: string | null;
}

// MiniPlayer Component
const MiniPlayer = memo(
  ({
    audioState,
    slideAnim,
    currentTrack,
    seekAudio,
    formatTime,
    skipAudio,
    togglePlayback,
    stopAudio,
    changePlaybackRate,
    colors,
    dark,
    insets,
  }: {
    audioState: AudioState;
    slideAnim: Animated.Value;
    currentTrack: Resource | null;
    seekAudio: (position: number) => Promise<void>;
    formatTime: (millis: number) => string;
    skipAudio: (seconds: number) => Promise<void>;
    togglePlayback: () => Promise<void>;
    stopAudio: () => Promise<void>;
    changePlaybackRate: (rate: number) => Promise<void>;
    colors: any;
    dark: boolean;
    insets: any;
  }) => {
    const [sliderValue, setSliderValue] = useState(audioState.position);
    const [isSliding, setIsSliding] = useState(false);

    // Update slider value when not sliding
    useEffect(() => {
      if (!isSliding) {
        setSliderValue(audioState.position);
      }
    }, [audioState.position, isSliding]);

    if (!currentTrack) return null;

    return (
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [200, 0],
              }),
            },
          ],
        }}>
        <View 
          style={{
            backgroundColor: dark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
            borderTopWidth: 1,
            borderTopColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 16 }}>
            {/* Track info section */}
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Album art placeholder */}
              <View
                style={{
                  marginRight: 16,
                  height: 56,
                  width: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: dark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
                  borderWidth: 1,
                  borderColor: dark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)',
                }}>
                <MaterialCommunityIcons name="music-note" size={24} color={colors.primary} />
              </View>

              {/* Track details */}
              <View style={{ flex: 1, justifyContent: 'center', minHeight: 56 }}>
                <Text
                  style={{
                    marginBottom: 4,
                    fontSize: 18,
                    fontWeight: 'bold',
                    lineHeight: 24,
                    color: dark ? '#ffffff' : '#111827',
                  }}
                  numberOfLines={2}>
                  {currentTrack.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {audioState.isBuffering || audioState.isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: dark ? '#9ca3af' : '#6b7280' }}>
                        Buffering...
                      </Text>
                    </View>
                  ) : audioState.error ? (
                    <Text style={{ fontSize: 14, color: 'white' }}>
                      playing...
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 14, color: dark ? '#9ca3af' : '#6b7280' }}>
                      Podcast Episode
                    </Text>
                  )}
                </View>
              </View>

              {/* Close button */}
              <TouchableOpacity
                onPress={stopAudio}
                style={{
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: dark ? 'rgba(156,163,175,0.1)' : 'rgba(107,114,128,0.1)',
                }}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={dark ? '#9ca3af' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>

            {/* Progress slider */}
            <Slider
              style={{ width: '100%', height: 40, marginBottom: 4 }}
              minimumValue={0}
              maximumValue={Math.max(1, audioState.duration)}
              value={sliderValue}
              onValueChange={(val) => {
                setIsSliding(true);
                setSliderValue(val);
              }}
              onSlidingComplete={async (val) => {
                setIsSliding(false);
                await seekAudio(val);
              }}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={dark ? '#374151' : '#e5e7eb'}
              thumbTintColor={'rgba(59, 130, 246, 0.8)'}
              disabled={audioState.isLoading || audioState.error !== null}
            />

            {/* Time display */}
            <View style={{ marginBottom: 16, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: dark ? '#9ca3af' : '#6b7280' }}>
                {formatTime(isSliding ? sliderValue : audioState.position)}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: dark ? '#9ca3af' : '#6b7280' }}>
                {formatTime(audioState.duration)}
              </Text>
            </View>

            {/* Main control buttons */}
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <TouchableOpacity
                onPress={() => skipAudio(-10)}
                style={{
                  height: 48,
                  width: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 24,
                  backgroundColor: dark ? 'rgba(156,163,175,0.1)' : 'rgba(107,114,128,0.1)',
                }}
                activeOpacity={0.8}
                disabled={audioState.isLoading || audioState.error !== null}>
                <MaterialCommunityIcons
                  name="rewind-10"
                  size={24}
                  color={dark ? '#e5e7eb' : '#374151'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayback}
                style={{
                  height: 64,
                  width: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 32,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }}
                disabled={audioState.isLoading || audioState.error !== null}
                activeOpacity={0.9}>
                {audioState.isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons
                    name={audioState.isPlaying ? 'pause' : 'play'}
                    size={32}
                    color="white"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => skipAudio(30)}
                style={{
                  height: 48,
                  width: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 24,
                  backgroundColor: dark ? 'rgba(156,163,175,0.1)' : 'rgba(107,114,128,0.1)',
                }}
                activeOpacity={0.8}
                disabled={audioState.isLoading || audioState.error !== null}>
                <MaterialCommunityIcons
                  name="fast-forward-30"
                  size={24}
                  color={dark ? '#e5e7eb' : '#374151'}
                />
              </TouchableOpacity>
            </View>

            {/* Playback rate controls */}
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{ marginBottom: 12, fontSize: 12, fontWeight: '500', color: dark ? '#9ca3af' : '#6b7280' }}>
                PLAYBACK SPEED
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => {
                  const isActive = Math.abs(audioState.playbackRate - rate) < 0.01;
                  return (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => changePlaybackRate(rate)}
                      style={{
                        minWidth: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: isActive
                          ? colors.primary
                          : dark
                            ? 'rgba(156,163,175,0.1)'
                            : 'rgba(107,114,128,0.1)',
                      }}
                      activeOpacity={0.8}
                      disabled={audioState.isLoading || audioState.error !== null}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: isActive ? 'blue' : dark ? '#d1d5db' : '#374151',
                        }}>
                        {rate}x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }
);

MiniPlayer.displayName = 'MiniPlayer';

const Resources = () => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const netInfo = NetInfo.useNetInfo();
  
  // Refs for cleanup and state management
  const isMountedRef = useRef(true);
  const playerRef = useRef<AudioPlayer | null>(null);
  const audioLoadedRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const positionUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resources = useQuery(api.resource.listAudios);

  // Create player instance once
  const player = useAudioPlayer();
  playerRef.current = player;
  
  const status = useAudioPlayerStatus(player);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    currentTrackId: null,
    position: 0,
    duration: 0,
    playbackRate: 1.0,
    isBuffering: false,
    error: null,
  });

  // Initialize audio mode once on mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'mixWithOthers',
          interruptionModeAndroid: 'doNotMix',
          shouldRouteThroughEarpiece: false,
        });
      } catch (error) {
        console.warn('Failed to set audio mode:', error);
      }
    };

    initializeAudio();

    return () => {
      isMountedRef.current = false;
      if (positionUpdateIntervalRef.current) {
        clearInterval(positionUpdateIntervalRef.current);
      }
    };
  }, []);

  // Update audio state from player status
  useEffect(() => {
    if (!isMountedRef.current) return;

    const newState: Partial<AudioState> = {
      isPlaying: status.playing || false,
      isBuffering: status.isBuffering || false,
      playbackRate: status.playbackRate || 1.0,
    };

    // Only update position and duration if we have valid values
    if (status.currentTime !== undefined && status.currentTime >= 0) {
      newState.position = status.currentTime * 1000;
    }
    
    if (status.duration !== undefined && status.duration > 0) {
      newState.duration = status.duration * 1000;
      
      // Clear loading state when we have duration
      if (audioState.isLoading && status.isLoaded) {
        newState.isLoading = false;
        newState.error = null;
      }
    }

    // Handle errors
    if (!status.isLoaded) {
      newState.error = 'Failed to load audio';
      newState.isLoading = false;
      newState.isPlaying = false;
    }

    setAudioState(prev => ({
      ...prev,
      ...newState,
    }));

    // Mark audio as loaded
    if (status.isLoaded && !audioLoadedRef.current) {
      audioLoadedRef.current = true;
    }
  }, [status, audioState.isLoading]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background - continue playing if audio is active
        if (audioState.isPlaying && playerRef.current) {
          // Audio should continue in background due to audio mode settings
        }
      } else if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App coming to foreground - ensure UI is in sync
        if (playerRef.current && audioLoadedRef.current) {
          // Force UI update
          setAudioState(prev => ({ ...prev }));
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [audioState.isPlaying]);

  // Show/hide mini player with animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: audioState.currentTrackId ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [audioState.currentTrackId, slideAnim]);

  const formatTime = useCallback((millis: number): string => {
    if (!millis || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getCurrentTrack = useCallback((): Resource | null => {
    if (!resources || !audioState.currentTrackId) return null;
    return resources.find((r) => r._id === audioState.currentTrackId) || null;
  }, [resources, audioState.currentTrackId]);

  const playAudio = useCallback(
    async (item: Resource) => {
      // Check internet connection
      if (!netInfo.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'You need an active internet connection to stream podcasts. Please check your network settings.',
        );
        return;
      }

      // Prevent multiple simultaneous transitions
      if (isTransitioningRef.current) {
        return;
      }

      // Validate URL
      if (!item.url) {
        Alert.alert('Error', 'This podcast episode is not available.');
        return;
      }

      try {
        isTransitioningRef.current = true;
        const isNewTrack = audioState.currentTrackId !== item._id;
        const isCurrentlyPlaying = audioState.currentTrackId === item._id && audioState.isPlaying;

        if (!playerRef.current) {
          throw new Error('Audio player not initialized');
        }

        // If clicking the same track that's playing, just pause
        if (isCurrentlyPlaying) {
          await playerRef.current.pause();
          setAudioState(prev => ({ ...prev, isPlaying: false }));
          return;
        }

        // Set loading state
        setAudioState(prev => ({
          ...prev,
          isLoading: true,
          isBuffering: true,
          error: null,
        }));

        if (isNewTrack) {
          // Stop current track if playing
          if (audioLoadedRef.current) {
            try {
              await playerRef.current.pause();
              await playerRef.current.seekTo(0);
            } catch (error) {
              console.warn('Error stopping previous track:', error);
            }
          }

          // Load new track
          audioLoadedRef.current = false;
          setAudioState(prev => ({
            ...prev,
            currentTrackId: item._id,
            position: 0,
            duration: 0,
            playbackRate: 1.0,
            isPlaying: false,
          }));

          // Replace audio source
          await playerRef.current.replace({ uri: item.url });
          
          // Wait a bit for audio to load
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Set playback rate
          await playerRef.current.setPlaybackRate(1.0);
          audioLoadedRef.current = true;
        }

        // Start playback
        await playerRef.current.play();
        
        setAudioState(prev => ({
          ...prev,
          isPlaying: true,
          isLoading: false,
        }));

      } catch (error) {
        console.error('Error playing audio:', error);
        audioLoadedRef.current = false;
        
        setAudioState(prev => ({
          ...prev,
          isLoading: false,
          isBuffering: false,
          isPlaying: false,
          error: 'Failed to play audio. Please try again.',
        }));
        
        Alert.alert(
          'Playback Error',
          'Unable to play this episode. Please check your internet connection and try again.',
        );
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [audioState, netInfo.isConnected],
  );

  const togglePlayback = useCallback(async () => {
    if (!playerRef.current || !audioLoadedRef.current) return;

    try {
      if (audioState.isPlaying) {
        await playerRef.current.pause();
      } else {
        // Check if at the end and reset if needed
        if (status.didJustFinish) {
          await playerRef.current.seekTo(0);
        }
        await playerRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setAudioState(prev => ({ ...prev, error: 'Playback error' }));
    }
  }, [audioState.isPlaying, status.didJustFinish]);

  const seekAudio = useCallback(async (position: number) => {
    if (!playerRef.current || !audioLoadedRef.current) return;

    try {
      const positionInSeconds = Math.max(0, Math.min(position / 1000, (audioState.duration / 1000) || 0));
      await playerRef.current.seekTo(positionInSeconds);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  }, [audioState.duration]);

  const skipAudio = useCallback(
    async (seconds: number) => {
      if (!playerRef.current || !audioLoadedRef.current) return;

      const newPosition = Math.max(
        0,
        Math.min(audioState.position + seconds * 1000, audioState.duration),
      );
      await seekAudio(newPosition);
    },
    [audioState.position, audioState.duration, seekAudio],
  );

  const stopAudio = useCallback(async () => {
    if (!playerRef.current) return;

    try {
      isTransitioningRef.current = true;
      
      if (audioLoadedRef.current) {
        await playerRef.current.pause();
        await playerRef.current.seekTo(0);
      }

      setAudioState({
        isPlaying: false,
        isLoading: false,
        currentTrackId: null,
        position: 0,
        duration: 0,
        playbackRate: 1.0,
        isBuffering: false,
        error: null,
      });

      audioLoadedRef.current = false;
    } catch (error) {
      console.error('Error stopping audio:', error);
    } finally {
      isTransitioningRef.current = false;
    }
  }, []);

  const changePlaybackRate = useCallback(async (rate: number) => {
    if (!playerRef.current || !audioLoadedRef.current) return;

    try {
      await playerRef.current.setPlaybackRate(rate);
      setAudioState(prev => ({ ...prev, playbackRate: rate }));
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    if (!netInfo.isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Cannot refresh content without an internet connection.',
      );
      setRefreshing(false);
      return;
    }
    
    // Convex will handle re-query
    setTimeout(() => setRefreshing(false), 1000);
  }, [netInfo.isConnected]);

  const renderResource = useCallback(
    ({ item }: { item: Resource }) => {
      const isCurrentTrack = audioState.currentTrackId === item._id;
      const isPlaying = isCurrentTrack && audioState.isPlaying;
      const isLoading = isCurrentTrack && audioState.isLoading;

      return (
        <TouchableOpacity
          onPress={() => playAudio(item)}
          activeOpacity={0.8}
          style={{
            marginBottom: 12,
            backgroundColor: colors.card,
            borderRadius: 8,
            overflow: 'hidden',
            borderWidth: isCurrentTrack ? 2 : 0,
            borderColor: isCurrentTrack ? colors.primary : 'transparent',
          }}>
          {isCurrentTrack && (
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'transparent']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
              }}
            />
          )}

          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name={isPlaying ? 'pause' : 'play'}
                    size={28}
                    color="#fff"
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: '600',
                    fontSize: 16,
                    color: colors.text,
                  }}
                  numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      color: dark ? '#9ca3af' : '#6b7280',
                    }}
                    numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>

            {isCurrentTrack && audioState.duration > 0 && (
              <View style={{ marginTop: 16 }}>
                <View
                  style={{
                    height: 2,
                    backgroundColor: dark ? '#374151' : '#e5e7eb',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: colors.primary,
                      width: `${Math.min(100, (audioState.position / audioState.duration) * 100)}%`,
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 6,
                  }}>
                  <Text style={{ fontSize: 12, color: colors.text }}>
                    {formatTime(audioState.position)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text }}>
                    {formatTime(audioState.duration)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [audioState, colors, dark, formatTime, playAudio],
  );

  // Loading state
  if (resources === undefined) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {netInfo.isConnected === false ? (
            <>
              <MaterialCommunityIcons name="wifi-off" size={50} color={colors.text} />
              <Text style={{ marginTop: 10, color: colors.text }}>
                No internet connection. Please connect to load podcasts.
              </Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 10, color: colors.text }}>Loading podcasts...</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!resources || resources.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="podcast" size={50} color={colors.text} />
          <Text style={{ marginTop: 10, color: colors.text }}>No podcast episodes available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Header */}
      <View className="px-4 py-6">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="mb-1 text-3xl font-bold">Podcast with KK Baidoo</Text>
            <Text className="text-sm text-muted-foreground">
              {resources.length} episodes
            </Text>
          </View>
        </View>
      </View>  
      {/* MiniPlayer */}
      <MiniPlayer
        audioState={audioState}
        slideAnim={slideAnim}
        currentTrack={getCurrentTrack()}
        seekAudio={seekAudio}
        formatTime={formatTime}
        skipAudio={skipAudio}
        togglePlayback={togglePlayback}
        stopAudio={stopAudio}
        changePlaybackRate={changePlaybackRate}
        colors={colors}
        dark={dark}
        insets={insets}
      />

      {/* Resources List */}
      <FlatList
        data={resources}
        renderItem={renderResource}
        keyExtractor={(item) => item._id.toString()}
        className="mx-4 flex-1"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: audioState.currentTrackId ? 300 : insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={dark ? '#1f2937' : '#f9fafb'}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={undefined} // Let FlatList auto-calculate
      />
    </SafeAreaView>
  );
};

export default Resources;