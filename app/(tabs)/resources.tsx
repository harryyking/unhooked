import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  PitchCorrectionQuality,
} from 'expo-audio';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import NetInfo from '@react-native-community/netinfo'; // Add this import for internet connection check

// Convex API
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'; // Import Id for branded types

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Unused, but kept for completeness.

// Enhanced data structure (updated to match Convex's actual shape)
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
  currentTrack: string | null;
  position: number;
  duration: number;
  playbackRate: number;
  isBuffering: boolean;
}

// Define MiniPlayer outside as a memoized component for stability.
const MiniPlayer = memo(
  ({
    audioState,
    slideAnim,
    getCurrentTrack,
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
    getCurrentTrack: () => Resource | null;
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
    const currentTrack = getCurrentTrack();
    if (!currentTrack) return null;

    return (
      <Animated.View
        style={{
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        }}
        className="absolute bottom-0 left-0 right-0 z-50">
        {/* Enhanced backdrop with better blur and styling */}
        <View className={`${dark ? 'bg-background' : 'bg-white/95'} backdrop-blur-xl`}>
          {/* Top accent line */}
          <View className="h-0.5 w-full bg-background" />

          <View className="px-6 py-4" style={{ paddingBottom: insets.bottom + 16 }}>
            {/* Track info section with better layout */}
            <View className="mb-4 flex-row items-start">
              {/* Album art placeholder with gradient */}
              <View
                className={`mr-4 h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${dark ? 'from-primary/20 to-primary/40' : 'from-primary/10 to-primary/20'} border ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                <MaterialCommunityIcons name="music-note" size={24} color={colors.primary} />
              </View>

              {/* Track details */}
              <View className="min-h-[56px] flex-1 justify-center">
                <Text
                  className={`mb-1 text-lg font-bold leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}
                  numberOfLines={2}>
                  {currentTrack.title}
                </Text>
                <View className="flex-row items-center">
                  {audioState.isBuffering || audioState.isLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text className={`ml-2 text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Buffering...
                      </Text>
                    </View>
                  ) : (
                    <Text className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Podcast Episode
                    </Text>
                  )}
                </View>
              </View>

              {/* Compact stop button */}
              <TouchableOpacity
                onPress={stopAudio}
                className={`h-8 w-8 items-center justify-center rounded-lg ${dark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={dark ? '#9ca3af' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>

            {/* Enhanced progress slider */}
            <Slider
              style={{ width: '100%', height: 40, marginBottom: 4 }}
              minimumValue={0}
              maximumValue={audioState.duration}
              value={audioState.position}
              onValueChange={(val) => {}}
              onSlidingComplete={seekAudio}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={dark ? '#374151' : '#e5e7eb'}
              thumbTintColor={colors.primary}
            />

            {/* Time display */}
            <View className="mb-4 mt-1 flex-row justify-between">
              <Text className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatTime(audioState.position)}
              </Text>
              <Text className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatTime(audioState.duration)}
              </Text>
            </View>

            {/* Main control buttons */}
            <View className="mb-4 flex-row items-center justify-center gap-6">
              <TouchableOpacity
                onPress={() => skipAudio(-10)}
                className={`h-12 w-12 items-center justify-center rounded-full ${dark ? 'bg-gray-800 active:bg-gray-700' : 'bg-gray-100 active:bg-gray-200'}`}
                activeOpacity={0.8}>
                <MaterialCommunityIcons
                  name="rewind-10"
                  size={24}
                  color={dark ? '#e5e7eb' : '#374151'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayback}
                className="h-16 w-16 items-center justify-center rounded-full bg-secondary"
                disabled={audioState.isLoading}
                activeOpacity={0.9}>
                {audioState.isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons
                    name={audioState.isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={dark ? 'white' : 'black'}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => skipAudio(30)}
                className={`h-12 w-12 items-center justify-center rounded-full ${dark ? 'bg-gray-800 active:bg-gray-700' : 'bg-gray-100 active:bg-gray-200'}`}
                activeOpacity={0.8}>
                <MaterialCommunityIcons
                  name="fast-forward-30"
                  size={24}
                  color={dark ? '#e5e7eb' : '#374151'}
                />
              </TouchableOpacity>
            </View>

            {/* Enhanced playback rate controls */}
            <View className="items-center">
              <Text
                className={`mb-3 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                PLAYBACK SPEED
              </Text>
              <View className="flex-row items-center gap-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => {
                  const isActive = audioState.playbackRate === rate;
                  return (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => changePlaybackRate(rate)}
                      className={`min-w-[44px] items-center justify-center rounded-full px-3 py-2 ${
                        isActive
                          ? 'bg-primary'
                          : dark
                            ? 'bg-gray-800 active:bg-gray-700'
                            : 'bg-gray-100 active:bg-gray-200'
                      }`}
                      activeOpacity={0.8}>
                      <Text
                        className={`text-sm font-semibold ${
                          isActive ? 'text-white' : dark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
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

const Resources = () => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const netInfo = NetInfo.useNetInfo(); // Add this to track internet connection

  const resources = useQuery(api.resource.listAudios);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    playbackRate: 1.0,
    isBuffering: false,
  });

  useEffect(() => {
    setAudioState((prev) => ({
      ...prev,
      position: (status.currentTime ?? 0) * 1000,
      duration: (status.duration ?? 0) * 1000,
      isPlaying: status.playing,
      playbackRate: status.playbackRate ?? 1.0,
      isBuffering: status.isBuffering,
    }));
    if (audioState.isLoading && status.isLoaded && status.duration > 0) {
      setAudioState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [status]);

  const formatTime = useCallback((millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const playAudio = useCallback(
    async (item: Resource) => {
      // Check internet connection before attempting to play
      if (netInfo.isConnected !== true) {
        Alert.alert(
          'No Internet Connection',
          'You need an active internet connection to stream this podcast. Please check your network settings.'
        );
        return;
      }

      try {
        setAudioState((prev) => ({ ...prev, isLoading: true, isBuffering: true }));

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionModeAndroid: 'duckOthers',
          interruptionMode: 'mixWithOthers',
        });

        const isNewTrack = audioState.currentTrack !== item._id;

        if (isNewTrack) {
          setAudioState((prev) => ({
            ...prev,
            currentTrack: item._id,
            position: 0,
            duration: 0,
            playbackRate: 1.0,
          }));
          player.replace({ uri: item.url! });
          await player.seekTo(0);
          player.setPlaybackRate(1.0, 'high');
        }

        if (!isNewTrack && status.didJustFinish) {
          await player.seekTo(0);
        }

        if (!isNewTrack && audioState.isPlaying) {
          player.pause();
        } else {
          player.play();
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        Alert.alert('Error', 'Failed to play audio. Please try again.');
        setAudioState((prev) => ({
          ...prev,
          isLoading: false,
          isBuffering: false,
          isPlaying: false,
        }));
      }
    },
    [audioState, player, status, netInfo.isConnected, slideAnim]
  );

  const togglePlayback = useCallback(async () => {
    try {
      if (status.didJustFinish && !audioState.isPlaying) {
        await player.seekTo(0);
      }
      if (audioState.isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }, [audioState.isPlaying, player, status.didJustFinish]);

  const seekAudio = useCallback(
    async (position: number) => {
      try {
        await player.seekTo(position / 1000);
      } catch (error) {
        console.error('Error seeking audio:', error);
      }
    },
    [player]
  );

  const skipAudio = useCallback(
    async (seconds: number) => {
      const newPosition = Math.max(
        0,
        Math.min(audioState.position + seconds * 1000, audioState.duration)
      );
      await seekAudio(newPosition);
    },
    [audioState.position, audioState.duration, seekAudio]
  );

  const stopAudio = useCallback(async () => {
    try {
      player.pause();
      await player.seekTo(0);

      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTrack: null,
        position: 0,
        duration: 0,
      }));

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, [player, slideAnim]);

  const changePlaybackRate = useCallback(
    async (rate: number) => {
      try {
        player.setPlaybackRate(rate, 'high');
      } catch (error) {
        console.error('Error changing playback rate:', error);
      }
    },
    [player]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Cannot refresh content without an internet connection. Please check your network.'
      );
      setRefreshing(false);
      return;
    }
    // Proceed with refresh (Convex will handle re-query)
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getCurrentTrack = useCallback(() => {
    if (!resources) return null;
    return resources.find((r) => r._id === audioState.currentTrack) ?? null; // Fix: Convert undefined to null
  }, [resources, audioState.currentTrack]);

  const renderResource = useCallback(
    ({ item }: { item: Resource }) => {
      const isCurrentTrack = audioState.currentTrack === item._id;
      const isPlaying = isCurrentTrack && audioState.isPlaying;

      return (
        <TouchableOpacity
          onPress={() => playAudio(item)}
          activeOpacity={0.8}
          style={[
            { marginBottom: 12, backgroundColor: colors.card, borderRadius: 8, overflow: 'hidden' },
            isCurrentTrack && {
              borderWidth: 2,
              borderColor: '#3b82f6',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          ]}>
          {isCurrentTrack && (
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.15)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
            />
          )}

          <View style={{ padding: 16 }} className="border border-border bg-secondary">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  backgroundColor: 'rgba(0, 70, 255, 1)',
                }}>
                {audioState.isLoading && isCurrentTrack ? (
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
                  style={{ fontWeight: '600', fontSize: 16, color: colors.text }}
                  numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
            </View>

            {isCurrentTrack && audioState.duration > 0 && (
              <View style={{ marginTop: 16 }}>
                <View
                  style={{
                    height: 1.5,
                    backgroundColor: dark ? '#374151' : '#e5e7eb',
                    borderRadius: 9999,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      width: `${(audioState.position / audioState.duration) * 100}%`,
                    }}
                  />
                </View>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
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
    [audioState, colors, dark, formatTime, playAudio]
  );

  if (resources === undefined) {
    if (netInfo.isConnected !== true) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="wifi-off" size={50} color={colors.text} />
          <Text style={{ marginTop: 10, color: colors.text }}>
            No internet connection. Please connect to load podcasts.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading podcasts...</Text>
      </View>
    );
  }

  if (resources.length === 0) {
    if (netInfo.isConnected !== true) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="wifi-off" size={50} color={colors.text} />
          <Text style={{ marginTop: 10, color: colors.text }}>
            No internet connection. Please connect to load podcasts.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="cloud-off-outline" size={50} color={colors.text} />
        <Text style={{ marginTop: 10, color: colors.text }}>No audio files found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View className="px-4 py-6">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="mb-1 text-3xl font-bold">Podcast with KK Baidoo</Text>
            <Text className="text-sm text-muted-foreground">{resources.length} episodes</Text>
          </View>
        </View>
      </View>

      <MiniPlayer
        audioState={audioState}
        slideAnim={slideAnim}
        getCurrentTrack={getCurrentTrack}
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

      <FlatList
        data={resources}
        renderItem={renderResource}
        keyExtractor={(item) => item._id}
        className="mx-4 flex-1"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: audioState.currentTrack ? 200 : insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

export default Resources;
