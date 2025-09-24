

import { StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native"
// import { Text } from "./ui/text"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card"
import { LinearGradient } from "expo-linear-gradient"
import { Audio } from "expo-av"
import { Ionicons } from "@expo/vector-icons"

const PrayerCard: React.FC = () => {
  const [showPrayerModal, setShowPrayerModal] = useState<boolean>(false)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [currentPhase, setCurrentPhase] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Prayer phases with guidance text
  const prayerPhases: { time: number; text: string }[] = [
    { time: 60, text: "Take a deep breath and quiet your heart before God" },
    { time: 50, text: "Give thanks for His love and faithfulness today" },
    { time: 35, text: "Bring your worries and concerns to Him" },
    { time: 20, text: "Pray for others - family, friends, and community" },
    { time: 5, text: "Close with gratitude and trust in His plan" },
    { time: 0, text: "Amen. Go in peace, knowing you are loved." },
  ]

  useEffect((): (() => void) | undefined => {
    return sound
      ? () => {
          sound.unloadAsync()
        }
      : undefined
  }, [sound])

  const loadAndPlaySound = async (): Promise<void> => {
    try {
      const { sound } = await Audio.Sound.createAsync(require("../../assets/audio/instrumental.mp3"), {
        shouldPlay: true,
        isLooping: true,
        volume: 0.3,
      })
      setSound(sound)
    } catch (error) {
      console.log("Error loading sound:", error)
    }
  }

  const startPrayer = async (): Promise<void> => {
    setTimeLeft(60)
    setIsActive(true)
    setCurrentPhase(0)
    await loadAndPlaySound()

    intervalRef.current = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsActive(false)
          return 0
        }
        return time - 1
      })
    }, 1000)
  }

  const stopPrayer = async (): Promise<void> => {
    setIsActive(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (sound) {
      await sound.stopAsync()
      await sound.unloadAsync()
      setSound(null)
    }
  }

  const closePrayerModal = async (): Promise<void> => {
    await stopPrayer()
    setShowPrayerModal(false)
    setTimeLeft(60)
    setCurrentPhase(0)
  }

  // Update current phase based on time
  useEffect((): void => {
    const phase = prayerPhases.findIndex((phase) => timeLeft >= phase.time)
    setCurrentPhase(phase === -1 ? prayerPhases.length - 1 : phase)
  }, [timeLeft])

  // Auto close modal when prayer ends
  useEffect((): void => {
    if (timeLeft === 0 && isActive === false) {
      setTimeout(async () => {
        await closePrayerModal()
      }, 3000) // Show final message for 3 seconds
    }
  }, [timeLeft, isActive])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePrayerCardPress = (): void => {
    setShowPrayerModal(true)
  }

  return (
    <>
      <TouchableOpacity onPress={handlePrayerCardPress} activeOpacity={0.9}>
        <Card className="overflow-hidden p-0 shadow-lg">
          <LinearGradient
            colors={["#FEF7ED", "#FED7AA", "#FDBA74"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <CardContent className="p-6">
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconBackground}>
                    <Ionicons name="heart" size={24} color="#C2410C" />
                  </View>
                </View>
                <View style={styles.textContainer}>
                  <CardTitle className="text-orange-900 text-lg font-semibold mb-1">Prayer Time</CardTitle>
                  <CardDescription className="text-orange-700 text-sm leading-relaxed">
                    A moment of peace with God
                  </CardDescription>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.durationBadge}>
                  <Ionicons name="time-outline" size={14} color="#C2410C" />
                  <Text className="text-orange-800 text-xs font-medium ml-1">1 minute</Text>
                </View>
                <Text className="text-orange-600 text-xs">Tap to begin →</Text>
              </View>
            </CardContent>
          </LinearGradient>
        </Card>
      </TouchableOpacity>

      <Modal
        visible={showPrayerModal}
        animationType="fade"
        presentationStyle="pageSheet"
        onRequestClose={closePrayerModal}
      >
        <LinearGradient colors={["#F8FAFC", "#F1F5F9", "#E2E8F0"]} style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={closePrayerModal}>
            <View style={styles.closeButtonBackground}>
              <Ionicons name="close" size={20} color="#64748B" />
            </View>
          </TouchableOpacity>

          {/* Prayer Content */}
          <View style={styles.prayerContent}>
            {/* Header */}
            <View style={styles.headerSection}>
              <View style={styles.titleIconContainer}>
                <Ionicons name="leaf-outline" size={28} color="#059669" />
              </View>
              <Text style={styles.prayerTitle}>One Minute with God</Text>
              <Text style={styles.prayerSubtitle}>Find peace in His presence</Text>
            </View>

            {/* Timer Circle */}
            <View style={styles.timerSection}>
              <View style={styles.timerContainer}>
                <View style={styles.timerInnerCircle}>
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                  <View style={styles.timerProgress} />
                </View>
              </View>
            </View>

            {/* Prayer Guide Text */}
            <View style={styles.guideSection}>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideText}>{prayerPhases[currentPhase]?.text}</Text>
              </View>
            </View>

            {/* Control Buttons */}
            <View style={styles.controlSection}>
              {!isActive ? (
                <TouchableOpacity style={styles.primaryButton} onPress={startPrayer}>
                  <LinearGradient colors={["#059669", "#047857"]} style={styles.buttonGradient}>
                    <Ionicons name="play" size={20} color="white" />
                    <Text style={styles.buttonText}>Begin Prayer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.secondaryButton} onPress={stopPrayer}>
                  <View style={styles.stopButtonBackground}>
                    <Ionicons name="pause" size={20} color="#DC2626" />
                    <Text style={styles.stopButtonText}>Pause</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </>
  )
}

export default PrayerCard

const styles = StyleSheet.create({
  gradientCard: {
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(194, 65, 12, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(194, 65, 12, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  modalContainer: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1,
  },
  closeButtonBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prayerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  titleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  prayerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  prayerSubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  timerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  timerContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  timerInnerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    
  },
  timerText: {
    fontSize: 36,
    fontWeight: "400",
    color: "#1E293B",
    letterSpacing: 1,
  },
  timerProgress: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#059669",
    top: 10,
  },
  guideSection: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 40,
  },
  guideTextContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  guideText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#374151",
    textAlign: "center",
    fontWeight: "400",
  },
  controlSection: {
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    maxWidth: 280,
  },
  secondaryButton: {
    width: "100%",
    maxWidth: 280,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  stopButtonBackground: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 8,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#FEE2E2",
  },
  stopButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
})
