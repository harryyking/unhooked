// app/(tabs)/prayer-session.tsx - Enhanced with beautiful animations and user-controlled silent mode
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Alert, Animated, Easing, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';

const { width, height } = Dimensions.get('window');

const GUIDANCE_PROMPTS = [
  "Breathe deeply and center your heart on God's presence.",
  "Let His light fill your soul with peace and hope.",
  "Release your burdens and rest in His infinite love.",
  "Feel the warmth of His grace surrounding you.",
  "Listen to the stillness and hear His gentle whisper.",
  "You are loved, you are forgiven, you are free."
];

export default function PrayerSession() {
  const router = useRouter();
  const { verse: dailyVerse } = useLocalSearchParams<{ verse: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3 * 60); // 3 minutes
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [allowSilentMode, setAllowSilentMode] = useState(false); // User permission for silent mode override
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const promptIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const promptFadeAnim = useRef(new Animated.Value(1)).current;
  const orbFloatAnim = useRef(new Animated.Value(0)).current;
  
  // Particle animations for ambient effect
  const particles = useRef(
    [...Array(6)].map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(height),
      opacity: new Animated.Value(0)
    }))
  ).current;

  // Helper for smooth fade-out (2 seconds by default)
  const fadeOutAudio = async (fadeDuration: number = 2000) => {
    if (!sound) return;
    
    const steps = 20;  // Number of fade steps for smoothness
    const stepTime = fadeDuration / steps;
    let currentVolume = 1.0;
    
    const fadeInterval = setInterval(async () => {
      currentVolume -= (1.0 / steps);
      if (currentVolume <= 0) {
        clearInterval(fadeInterval);
        await sound.stopAsync().catch(console.error);
        await sound.unloadAsync().catch(console.error);
        setSound(null);
      } else {
        await sound.setVolumeAsync(currentVolume).catch(console.error);
      }
    }, stepTime);
  };

  useEffect(() => {
    // Initial fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();

    return () => {
      sound?.unloadAsync().catch(console.error);
      intervalRef.current && clearInterval(intervalRef.current);
      promptIntervalRef.current && clearInterval(promptIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      // Clear intervals
      intervalRef.current && clearInterval(intervalRef.current);
      promptIntervalRef.current && clearInterval(promptIntervalRef.current);
      
      // Fade out audio before stopping
      if (sound) {
        fadeOutAudio();
      }
      
      setIsPlaying(false);
      
      Alert.alert(
        '🙏 Prayer Complete',
        'May God\'s peace and love remain with you always. Amen.',
        [{ 
          text: 'Amen', 
          onPress: () => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true
            }).start(() => router.back());
          }
        }]
      );
    }
  }, [secondsLeft, sound, router]);

  const startCelestialAnimations = () => {
    // Rotating glow effect
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
        easing: Easing.linear
      })
    ).start();

    // Pulsing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ])
    ).start();

    // Glow intensity animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad)
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad)
        })
      ])
    ).start();

    // Floating effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloatAnim, {
          toValue: -20,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(orbFloatAnim, {
          toValue: 20,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ])
    ).start();

    // Ambient particles
    particles.forEach((particle, index) => {
      const animateParticle = () => {
        particle.y.setValue(height);
        particle.x.setValue(Math.random() * width);
        particle.opacity.setValue(0);

        Animated.parallel([
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
        ]).start(() => animateParticle());
      };

      setTimeout(() => animateParticle(), index * 2000);
    });
  };

  const animatePromptChange = () => {
    Animated.sequence([
      Animated.timing(promptFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(promptFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  };

  const requestSilentModePermission = () => {
    Alert.alert(
      '🎵 Calming Music',
      'To hear the soothing instrumental during your prayer session, we can play audio even if your device is in silent mode. Would you like to enable this?\n\n(You can toggle silent mode off manually anytime.)',
      [
        {
          text: 'No, silent mode respected',
          style: 'cancel',
          onPress: () => {
            // Proceed without override
            proceedWithAudio(false);
          }
        },
        {
          text: 'Yes, play in silent mode',
          onPress: () => {
            setAllowSilentMode(true);
            // Proceed with override
            proceedWithAudio(true);
          }
        }
      ]
    );
  };

  const proceedWithAudio = async (playsInSilent: boolean) => {
    try {
      // Set audio mode based on permission (mixes with other audio to avoid interruptions)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: playsInSilent,
        interruptionModeIOS: 2,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        require('@/assets/audio/instrumental.mp3'),
        { shouldPlay: true, isLooping: true, volume: 0.7 }
      );
      setSound(newSound);
      setIsPlaying(true);
      startTimer();
      startCelestialAnimations();
    } catch (error) {
      console.error('Audio setup error:', error);
      // If audio fails entirely, still start the session without music
      setIsPlaying(true);
      startTimer();
      startCelestialAnimations();
      Alert.alert('Notice', 'Music could not be loaded. Continuing with guided prayer.');
    }
  };

  const loadAndPlayAudio = async () => {
    if (!allowSilentMode) {
      requestSilentModePermission();
    } else {
      proceedWithAudio(true);
    }
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    // Change prompts every 30 seconds for 3-minute session
    promptIntervalRef.current = setInterval(() => {
      animatePromptChange();
      setTimeout(() => {
        setCurrentPromptIndex((prev) => (prev + 1) % GUIDANCE_PROMPTS.length);
      }, 500);
    }, 30000);
  };

  const stopSession = async () => {
    intervalRef.current && clearInterval(intervalRef.current);
    promptIntervalRef.current && clearInterval(promptIntervalRef.current);
    
    // Fade out audio before stopping
    if (sound) {
      await fadeOutAudio();
    }
    
    // Reset for next session
    setAllowSilentMode(false);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true
    }).start(() => {
      setIsPlaying(false);
      router.back();
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!dailyVerse) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <Text className="text-foreground">No verse provided</Text>
      </SafeAreaView>
    );
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Modal visible={true} animationType="fade" statusBarTranslucent={true}>
      <LinearGradient
        colors={isDark 
          ? ['#0a0a0f', '#1a1a2e', '#16213e']
          : ['#f0f4ff', '#e6efff', '#d4e4ff']
        }
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Ambient Particles */}
          {particles.map((particle, index) => (
            <Animated.View
              key={index}
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
                onPress={stopSession}
                style={{
                  position: 'absolute',
                  top: 50,
                  left: 20,
                  zIndex: 100,
                  padding: 12,
                  borderRadius: 25,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
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
                    { scale: scaleAnim },
                    { translateY: orbFloatAnim }
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
                    opacity: glowAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.05, 0.15]
                    }),
                    transform: [{ scale: pulseAnim }, { rotate: spin }]
                  }} />
                  
                  <Animated.View style={{
                    position: 'absolute',
                    width: 250,
                    height: 250,
                    left: 25,
                    top: 25,
                    borderRadius: 125,
                    backgroundColor: isDark ? '#ffed4e' : '#ffcc00',
                    opacity: glowAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.1, 0.25]
                    }),
                    transform: [{ scale: pulseAnim }]
                  }} />

                  {/* Core orb */}
                  <Animated.View style={{
                    width: 200,
                    height: 200,
                    left: 50,
                    top: 50,
                    borderRadius: 100,
                    transform: [{ scale: pulseAnim }],
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
                      <Text style={{
                        fontSize: 42,
                        fontWeight: 'bold',
                        color: isDark ? '#1a1a2e' : '#16213e',
                        textShadowColor: 'rgba(255, 255, 255, 0.5)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3
                      }}>
                        {formatTime(secondsLeft)}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                </Animated.View>

                {/* Verse Display */}
                <Animated.View style={{
                  paddingHorizontal: 30,
                  marginBottom: 30,
                  opacity: promptFadeAnim,
                  transform: [{ scale: scaleAnim }]
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    color: isDark ? '#ffd700' : '#ff8c00',
                    fontWeight: '500',
                    lineHeight: 26,
                    textShadowColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 140, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4
                  }}>
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
                  opacity: promptFadeAnim,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,215,0,0.2)' : 'rgba(255,140,0,0.15)'
                }}>
                  <Text style={{
                    fontSize: 16,
                    textAlign: 'center',
                    color: isDark ? '#ffffff' : '#333333',
                    lineHeight: 24,
                    fontWeight: '400'
                  }}>
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
                  >
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: isDark ? '#1a1a2e' : '#ffffff',
                      letterSpacing: 1
                    }}>
                      Begin Prayer
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={stopSession}
                    style={{
                      paddingHorizontal: 50,
                      paddingVertical: 18,
                      borderRadius: 30,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      borderWidth: 2,
                      borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                    }}
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
                    opacity: glowAnim
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