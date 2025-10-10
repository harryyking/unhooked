// app/(tabs)/prayer-session.tsx - Production-ready with proper cleanup and error handling
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Alert,
  Animated,
  Easing,
  Dimensions,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';

const { width, height } = Dimensions.get('window');

// Constants
const INITIAL_SECONDS = 180; // 3 minutes
const PROMPT_CHANGE_INTERVAL = 30000; // 30 seconds
const TIMER_INTERVAL = 1000; // 1 second

const GUIDANCE_PROMPTS = [
  "Breathe deeply and center your heart on God's presence.",
  "Let His light fill your soul with peace and hope.",
  "Release your burdens and rest in His infinite love.",
  "Feel the warmth of His grace surrounding you.",
  "Listen to the stillness and hear His gentle whisper.",
  "You are loved, you are forgiven, you are free."
] as const;

// Types
interface AnimationRefs {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  rotateAnim: Animated.Value;
  pulseAnim: Animated.Value;
  glowAnim: Animated.Value;
  promptFadeAnim: Animated.Value;
  orbFloatAnim: Animated.Value;
}

interface ParticleAnimation {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
}

export default function PrayerSession() {
  const router = useRouter();
  const { verse: dailyVerse } = useLocalSearchParams<{ verse: string }>();
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [hasSessionEnded, setHasSessionEnded] = useState(false);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const animationLoopsRef = useRef<Animated.CompositeAnimation[]>([]);
  const appStateRef = useRef(AppState.currentState);
  const audioReleasedRef = useRef(false);
  const sessionCleanedUpRef = useRef(false);

  // Animation values - memoized to prevent recreation
  const animations = useMemo<AnimationRefs>(() => ({
    fadeAnim: new Animated.Value(0),
    scaleAnim: new Animated.Value(0.8),
    rotateAnim: new Animated.Value(0),
    pulseAnim: new Animated.Value(1),
    glowAnim: new Animated.Value(0.5),
    promptFadeAnim: new Animated.Value(1),
    orbFloatAnim: new Animated.Value(0),
  }), []);

  // Particle animations
  const particles = useMemo<ParticleAnimation[]>(() => 
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(height),
      opacity: new Animated.Value(0)
    })), []
  );

  // Audio setup
  const audioSource = useMemo(() => require('@/assets/audio/instrumental.mp3'), []);
  const player = useAudioPlayer(audioSource, 0.7);
  const status = useAudioPlayerStatus(player);

  // Helper function to safely check if we can proceed
  const canProceed = useCallback(() => {
    return isMountedRef.current && !hasSessionEnded && !sessionCleanedUpRef.current;
  }, [hasSessionEnded]);

  // Stop all animations
  const stopAllAnimations = useCallback(() => {
    animationLoopsRef.current.forEach(animation => animation.stop());
    animationLoopsRef.current = [];
  }, []);

  // Release audio player safely
  const releaseAudioSafely = useCallback(async () => {
    if (audioReleasedRef.current) return;
    
    try {
      if (player && status.isLoaded) {
        audioReleasedRef.current = true;
        await player.pause();
        await player.release();
      }
    } catch (error) {
      console.warn('Audio release error (expected if already released):', error);
    }
  }, [player, status.isLoaded]);

  // Complete session cleanup
  const cleanupSession = useCallback(async () => {
    if (sessionCleanedUpRef.current) return;
    sessionCleanedUpRef.current = true;

    stopAllAnimations();
    await releaseAudioSafely();
    setIsPlaying(false);
    setIsPaused(false);
  }, [stopAllAnimations, releaseAudioSafely]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextAppState === 'background') {
        // App going to background - pause session
        if (isPlaying && !isPaused) {
          setIsPaused(true);
          if (player && status.isLoaded && !audioReleasedRef.current) {
            player.pause();
          }
        }
      } else if (appStateRef.current.match(/background/) && nextAppState === 'active') {
        // App coming to foreground - resume if was playing
        if (isPlaying && isPaused && !hasSessionEnded) {
          setIsPaused(false);
          if (player && status.isLoaded && !audioReleasedRef.current) {
            player.play();
          }
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isPlaying, isPaused, hasSessionEnded, player, status.isLoaded]);

  // Set audio ready when loaded
  useEffect(() => {
    if (status.isLoaded && !audioReleasedRef.current) {
      setIsAudioReady(true);
    }
  }, [status.isLoaded]);

  // Initial animations on mount
  useEffect(() => {
    if (!canProceed()) return;

    Animated.parallel([
      Animated.timing(animations.fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.spring(animations.scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();

    return () => {
      isMountedRef.current = false;
    };
  }, [animations, canProceed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  // Handle session completion
  useEffect(() => {
    if (secondsLeft === 0 && !hasSessionEnded) {
      setHasSessionEnded(true);
      cleanupSession().then(() => {
        if (!canProceed()) return;
        
        Alert.alert(
          '🙏 Prayer Complete',
          'May God\'s peace and love remain with you always. Amen.',
          [{
            text: 'Amen',
            onPress: () => {
              Animated.timing(animations.fadeAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true
              }).start(() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/home');
                }
              });
            }
          }],
          { cancelable: false }
        );
      });
    }
  }, [secondsLeft, hasSessionEnded, cleanupSession, animations.fadeAnim, router, canProceed]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying || isPaused || hasSessionEnded || !canProceed()) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, TIMER_INTERVAL);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, hasSessionEnded, canProceed]);

  // Prompt change effect
  useEffect(() => {
    if (!isPlaying || isPaused || hasSessionEnded || !canProceed()) return;

    const interval = setInterval(() => {
      animatePromptChange();
      setTimeout(() => {
        if (canProceed()) {
          setCurrentPromptIndex(prev => (prev + 1) % GUIDANCE_PROMPTS.length);
        }
      }, 500);
    }, PROMPT_CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, hasSessionEnded, canProceed, animatePromptChange]);

  // Start celestial animations
  const startCelestialAnimations = useCallback(() => {
    if (!canProceed()) return;

    // Rotating glow effect
    const rotateAnimation = Animated.loop(
      Animated.timing(animations.rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
        easing: Easing.linear
      })
    );

    // Pulsing effect
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animations.pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(animations.pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ])
    );

    // Glow intensity animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animations.glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad)
        }),
        Animated.timing(animations.glowAnim, {
          toValue: 0.5,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad)
        })
      ])
    );

    // Floating effect
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animations.orbFloatAnim, {
          toValue: -20,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(animations.orbFloatAnim, {
          toValue: 20,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ])
    );

    // Start all animations
    rotateAnimation.start();
    pulseAnimation.start();
    glowAnimation.start();
    floatAnimation.start();

    // Store references for cleanup
    animationLoopsRef.current = [
      rotateAnimation,
      pulseAnimation,
      glowAnimation,
      floatAnimation
    ];

    // Animate particles
    particles.forEach((particle, index) => {
      const animateParticle = () => {
        if (!canProceed()) return;

        particle.y.setValue(height);
        particle.x.setValue(Math.random() * width);
        particle.opacity.setValue(0);

        const particleAnimation = Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -50,
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
            easing: Easing.linear
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.6,
              duration: 2000,
              useNativeDriver: true
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 2000,
              delay: 11000,
              useNativeDriver: true
            })
          ])
        ]);

        particleAnimation.start(() => {
          if (canProceed()) {
            animateParticle();
          }
        });

        animationLoopsRef.current.push(particleAnimation);
      };

      setTimeout(() => {
        if (canProceed()) {
          animateParticle();
        }
      }, index * 2000);
    });
  }, [animations, particles, canProceed]);

  // Animate prompt changes
  const animatePromptChange = useCallback(() => {
    if (!canProceed()) return;

    Animated.sequence([
      Animated.timing(animations.promptFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(animations.promptFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, [animations.promptFadeAnim, canProceed]);

  // Load and play audio
  const loadAndPlayAudio = useCallback(async () => {
    if (!isAudioReady || audioReleasedRef.current) {
      if (!isAudioReady) {
        Alert.alert('Loading', 'Preparing audio...');
      }
      return;
    }
    try {
      // Configure audio mode
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        interruptionModeAndroid:  'doNotMix',
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      });

      if (player && status.isLoaded && !audioReleasedRef.current) {
        player.loop = true;
        player.volume = 0.7;
        player.play();
        
        setIsPlaying(true);
        startCelestialAnimations();
      }
    } catch (error) {
      console.error('Audio setup error:', error);
      
      // Continue without audio if it fails
      Alert.alert(
        'Notice',
        'Music could not be loaded. Continuing with guided prayer.',
        [{ 
          text: 'Continue',
          onPress: () => {
            setIsPlaying(true);
            startCelestialAnimations();
          }
        }],
        { cancelable: false }
      );
    }
  }, [
    isAudioReady,
    canProceed,
    player,
    status.isLoaded,
    startCelestialAnimations
  ]);

  // Handle stop and go back
  const handleStopAndGoBack = useCallback(async () => {
    await cleanupSession();
    
    Animated.timing(animations.fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    });
  }, [cleanupSession, animations.fadeAnim, router]);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Interpolate rotation
  const spin = animations.rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Handle missing verse
  if (!dailyVerse) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <Text className="text-foreground">No verse provided</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 20, padding: 10 }}
        >
          <Text className="text-primary">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <Modal 
      visible={true} 
      animationType="fade" 
      statusBarTranslucent={true}
      onRequestClose={handleStopAndGoBack}
    >
      <LinearGradient
        colors={isDark 
          ? ['#0a0a0f', '#1a1a2e', '#16213e']
          : ['#f0f4ff', '#e6efff', '#d4e4ff']
        }
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={{ flex: 1, opacity: animations.fadeAnim }}>
          {/* Ambient Particles */}
          {particles.map((particle, index) => (
            <Animated.View
              key={`particle-${index}`}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? '#ffd700' : '#ffaa00',
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y }
                ]
              }}
            />
          ))}

          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 20 }}>
              {/* Back Button */}
              <Pressable
                onPress={handleStopAndGoBack}
                style={{
                  position: 'absolute',
                  top: 50,
                  left: 20,
                  zIndex: 100,
                  padding: 12,
                  borderRadius: 25,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={{ 
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  ← Back
                </Text>
              </Pressable>

              {/* Main Content */}
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {/* Celestial Orb */}
                <Animated.View style={{
                  transform: [
                    { scale: animations.scaleAnim },
                    { translateY: animations.orbFloatAnim }
                  ],
                  marginBottom: 40
                }}>
                  {/* Outer glow layers */}
                  <Animated.View style={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: 150,
                    backgroundColor: isDark ? '#ffd700' : '#ffaa00',
                    opacity: animations.glowAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.05, 0.15]
                    }),
                    transform: [{ scale: animations.pulseAnim }, { rotate: spin }]
                  }} />
                  
                  <Animated.View style={{
                    position: 'absolute',
                    width: 250,
                    height: 250,
                    left: 25,
                    top: 25,
                    borderRadius: 125,
                    backgroundColor: isDark ? '#ffed4e' : '#ffcc00',
                    opacity: animations.glowAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.1, 0.25]
                    }),
                    transform: [{ scale: animations.pulseAnim }]
                  }} />

                  {/* Core orb */}
                  <Animated.View style={{
                    width: 200,
                    height: 200,
                    left: 50,
                    top: 50,
                    borderRadius: 100,
                    transform: [{ scale: animations.pulseAnim }],
                    shadowColor: '#ffd700',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 30,
                    elevation: 20
                  }}>
                    <LinearGradient
                      colors={isDark 
                        ? ['#fff9e6', '#ffd700', '#ffaa00']
                        : ['#ffffff', '#ffed4e', '#ffd700']
                      }
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 100,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {/* Timer inside orb */}
                      <Text 
                        style={{
                          fontSize: 42,
                          fontWeight: 'bold',
                          color: isDark ? '#1a1a2e' : '#16213e',
                          textShadowColor: 'rgba(255, 255, 255, 0.5)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3
                        }}
                        accessibilityRole="timer"
                        accessibilityLabel={`${formatTime(secondsLeft)} remaining`}
                      >
                        {formatTime(secondsLeft)}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                </Animated.View>

                {/* Verse Display */}
                <Animated.View style={{
                  paddingHorizontal: 30,
                  marginBottom: 30,
                  opacity: animations.promptFadeAnim,
                  transform: [{ scale: animations.scaleAnim }]
                }}>
                  <Text 
                    style={{
                      fontSize: 18,
                      fontStyle: 'italic',
                      textAlign: 'center',
                      color: isDark ? '#ffd700' : '#ff8c00',
                      fontWeight: '500',
                      lineHeight: 26,
                      textShadowColor: isDark ? 'rgba(255,215,0,0.3)' : 'rgba(255,140,0,0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4
                    }}
                    accessibilityRole="text"
                    accessibilityLabel={`Bible verse: ${dailyVerse}`}
                  >
                    "{dailyVerse}"
                  </Text>
                </Animated.View>

                {/* Guidance Prompt */}
                <Animated.View style={{
                  paddingHorizontal: 40,
                  paddingVertical: 20,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 20,
                  marginBottom: 30,
                  opacity: animations.promptFadeAnim,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,215,0,0.2)' : 'rgba(255,140,0,0.15)'
                }}>
                  <Text 
                    style={{
                      fontSize: 16,
                      textAlign: 'center',
                      color: isDark ? '#ffffff' : '#333333',
                      lineHeight: 24,
                      fontWeight: '400'
                    }}
                    accessibilityRole="text"
                    accessibilityLabel={`Guidance: ${GUIDANCE_PROMPTS[currentPromptIndex]}`}
                  >
                    {GUIDANCE_PROMPTS[currentPromptIndex]}
                  </Text>
                </Animated.View>

                {/* Control Button */}
                {!isPlaying ? (
                  <Pressable
                    onPress={loadAndPlayAudio}
                    style={{
                      paddingHorizontal: 50,
                      paddingVertical: 18,
                      borderRadius: 30,
                      backgroundColor: isDark ? '#ffd700' : '#ff8c00',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 10
                    }}
                    disabled={!isAudioReady || hasSessionEnded}
                    accessibilityRole="button"
                    accessibilityLabel={isAudioReady ? 'Begin prayer session' : 'Loading audio'}
                    accessibilityState={{ disabled: !isAudioReady || hasSessionEnded }}
                  >
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: isDark ? '#1a1a2e' : '#ffffff',
                      letterSpacing: 1
                    }}>
                      {isAudioReady ? 'Begin Prayer' : 'Loading Audio...'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleStopAndGoBack}
                    style={{
                      paddingHorizontal: 50,
                      paddingVertical: 18,
                      borderRadius: 30,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      borderWidth: 2,
                      borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="End prayer session"
                  >
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: isDark ? '#ffffff' : '#333333'
                    }}>
                      End Session
                    </Text>
                  </Pressable>
                )}

                {/* Status Text */}
                {isPlaying && (
                  <Animated.View style={{
                    marginTop: 20,
                    opacity: animations.glowAnim
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      textAlign: 'center',
                      fontStyle: 'italic'
                    }}>
                      ✨ God's presence surrounds you ✨
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
}