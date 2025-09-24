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
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';

// Convex API
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'; // Import Id for branded types

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Unused, but kept for completeness.

// Enhanced data structure (updated to match Convex's actual shape)
interface Resource {
  _id: Id<"resources">;
  _creationTime: number;
  title: string;
  description?: string;
  url: string | null;
  storageId: Id<"_storage">;
  duration?: number;
  playCount?: number;
  isBookmarked?: boolean;
}

interface AudioState {
  sound: Audio.Sound | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTrack: string | null;
  position: number;
  duration: number;
  playbackRate: number;
  isBuffering: boolean;
}

// Define MiniPlayer outside as a memoized component for stability.
const MiniPlayer = memo(({
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
  colors: any; // From useTheme
  dark: boolean;
  insets: any; // From useSafeAreaInsets
}) => {
  const currentTrack = getCurrentTrack();
  if (!currentTrack || !audioState.sound) return null;

  return (
    <Animated.View
      style={{
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
          })
        }]
      }}
      className="absolute bottom-0 left-0 right-0 z-50"
    >
      <BlurView intensity={90} tint={colors.card === '#ffffff' ? 'light' : 'dark'}>
        <View className="p-4" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="mb-4">
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={audioState.duration}
              value={audioState.position}
              onSlidingComplete={seekAudio}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={'rgba(0, 70, 255, 1)'}
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs" style={{ color: colors.text }}>
                {formatTime(audioState.position)}
              </Text>
              <Text className="text-xs" style={{ color: colors.text }}>
                {formatTime(audioState.duration)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="font-bold text-base"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
              {audioState.isBuffering && (
                <Text className="text-xs" style={{ color: colors.primary }}>
                  Buffering...
                </Text>
              )}
            </View>

            <View className="flex-row items-center space-x-4">
              <TouchableOpacity
                onPress={() => skipAudio(-10)}
                className="p-2"
              >
                <MaterialCommunityIcons
                  name="rewind"
                  size={28}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayback}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.border }}
                disabled={audioState.isLoading}
              >
                {audioState.isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name={audioState.isPlaying ? "pause" : "play"}
                    size={28}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => skipAudio(30)}
                className="p-2"
              >
                <MaterialCommunityIcons
                  name="fast-forward-30"
                  size={28}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={stopAudio}
                className="p-2"
              >
                <MaterialCommunityIcons
                  name="stop"
                  size={24}
                  color={colors.notification}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center justify-center mt-3 gap-4">
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <TouchableOpacity
                key={rate}
                onPress={() => changePlaybackRate(rate)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999,
                  backgroundColor: audioState.playbackRate === rate ? '#3b82f6' : (dark ? '#374151' : '#e5e7eb')
                }}
              >
                <Text
                  style={{
                    fontSize: 12, fontWeight: '500',
                    color: audioState.playbackRate === rate ? '#fff' : (dark ? '#d1d5db' : '#374151')
                  }}
                >
                  {rate}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
});

const Resources = () => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const resources = useQuery(api.resource.listAudios);

  const [audioState, setAudioState] = useState<AudioState>({
    sound: null,
    isPlaying: false,
    isLoading: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    playbackRate: 1.0,
    isBuffering: false,
  });

  useEffect(() => {
    return () => {
      if (audioState.sound) {
        audioState.sound.unloadAsync();
      }
    };
  }, [audioState.sound]);

  const formatTime = useCallback((millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const playAudio = useCallback(async (item: Resource) => {
    try {
      setAudioState(prev => ({ ...prev, isLoading: true, isBuffering: true, currentTrack: item._id }));

      if (audioState.sound) {
        await audioState.sound.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.url! },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 100,
          positionMillis: 0,
        }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setAudioState(prev => ({
            ...prev,
            position: status.positionMillis || 0,
            duration: status.durationMillis || 0,
            isPlaying: status.isPlaying || false,
            isBuffering: status.isBuffering || false,
            isLoading: false,
          }));
        } else if (status.error) {
          console.error('Audio playback error:', status.error);
          Alert.alert('Playback Error', 'Unable to play this audio file.');
          setAudioState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isBuffering: false, 
            isPlaying: false 
          }));
        }
      });

      setAudioState(prev => ({
        ...prev,
        sound,
        currentTrack: item._id,
        isPlaying: true,
        isLoading: false,
      }));

      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
      setAudioState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isBuffering: false, 
        isPlaying: false 
      }));
    }
  }, [audioState.sound, slideAnim]);

  const togglePlayback = useCallback(async () => {
    if (!audioState.sound) return;
    try {
      if (audioState.isPlaying) {
        await audioState.sound.pauseAsync();
      } else {
        await audioState.sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }, [audioState.sound, audioState.isPlaying]);

  const seekAudio = useCallback(async (position: number) => {
    if (!audioState.sound) return;
    try {
      await audioState.sound.setPositionAsync(position);
      setAudioState(prev => ({ ...prev, position }));
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  }, [audioState.sound]);

  const skipAudio = useCallback(async (seconds: number) => {
    const newPosition = Math.max(0, Math.min(audioState.position + (seconds * 1000), audioState.duration));
    await seekAudio(newPosition);
  }, [audioState.position, audioState.duration, seekAudio]);

  const stopAudio = useCallback(async () => {
    if (!audioState.sound) return;
    try {
      await audioState.sound.stopAsync();
      await audioState.sound.unloadAsync();
      
      setAudioState(prev => ({
        ...prev,
        sound: null,
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
  }, [audioState.sound, slideAnim]);

  const changePlaybackRate = useCallback(async (rate: number) => {
    if (!audioState.sound) return;
    try {
      await audioState.sound.setRateAsync(rate, true);
      setAudioState(prev => ({ ...prev, playbackRate: rate }));
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  }, [audioState.sound]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getCurrentTrack = useCallback(() => {
    if (!resources) return null;
    return resources.find(r => r._id === audioState.currentTrack) ?? null; // Fix: Convert undefined to null
  }, [resources, audioState.currentTrack]);

  const renderResource = useCallback(({ item }: { item: Resource }) => {
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
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 
          }
        ]}
      >
        {isCurrentTrack && (
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.15)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
          />
        )}

        <View style={{ padding: 16 }} className='bg-secondary border border-border'>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View 
              style={{ 
                width: 48, height: 48, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginRight: 16, 
                backgroundColor: 'rgba(0, 70, 255, 1)' 
              }}
            >
              {audioState.isLoading && isCurrentTrack ? (
                <ActivityIndicator size='small' color="#fff" />
              ) : (
                <MaterialCommunityIcons
                  name={isPlaying ? "pause" : "play"}
                  size={28}
                  color="#fff"
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ fontWeight: '600', fontSize: 16, color: colors.text }}
                numberOfLines={1}
              >
                {item.title}
              </Text>

            </View>

          </View>

          {isCurrentTrack && audioState.duration > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={{ height: 1.5, backgroundColor: dark ? '#374151' : '#e5e7eb', borderRadius: 9999, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%', backgroundColor: '#3b82f6', width: `${(audioState.position / audioState.duration) * 100}%`
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
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
  }, [audioState, colors, dark, formatTime, playAudio]);

  if (resources === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading podcasts...</Text>
      </View>
    );
  }

  if (resources.length === 0) {
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
        <View className="px-4 py-8">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold mb-1">
                Podcast with KK Baidoo
              </Text>
              <Text className="text-muted-foreground text-sm">
                {resources.length} episodes
              </Text>
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
        className="flex-1 mx-4"
        contentContainerStyle={{ 
          paddingTop: 8, 
          paddingBottom: audioState.currentTrack ? 200 : insets.bottom + 20 
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