import { useState, useEffect, useMemo } from "react"
import { View, StyleSheet, Dimensions } from "react-native"
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G, Ellipse, RadialGradient } from "react-native-svg"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated"

const { width } = Dimensions.get("window")

const GRASS_PALETTE = {
  day: {
    backBase: "#14532d",
    backTip: "#166534",
    frontBase: "#15803d",
    frontTip: "#4ade80",
    tuftDark: "#16a34a",
    tuftLight: "#bef264",
  },
  night: {
    backBase: "#022c22",
    backTip: "#064e3b",
    frontBase: "#064e3b",
    frontTip: "#065f46",
    tuftDark: "#065f46",
    tuftLight: "#10b981",
  },
}

const GrassTuft = ({ x, y, scale = 1, delay = 0, isNight }: any) => {
  const sway = useSharedValue(0)

  useEffect(() => {
    sway.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(5, { duration: 2000 + Math.random() * 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(-5, { duration: 2200 + Math.random() * 500, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x }, { translateY: y }, { scale: scale }, { rotate: `${sway.value}deg` }],
  }))

  const colors = isNight ? GRASS_PALETTE.night : GRASS_PALETTE.day

  return (
    <Animated.View style={[styles.absoluteTuft, animatedStyle]}>
      <Svg width="40" height="40" viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id={`bladeGrad-${Math.random()}`} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={colors.tuftDark} stopOpacity="1" />
            <Stop offset="0.5" stopColor={colors.tuftDark} stopOpacity="0.8" />
            <Stop offset="1" stopColor={colors.tuftLight} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id={`shadowGrad-${Math.random()}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(0,0,0,0.3)" />
            <Stop offset="1" stopColor="rgba(0,0,0,0)" />
          </LinearGradient>
        </Defs>
        {/* Blade shadows for depth */}
        <Path d="M20 40 Q 15 25 10 15 L 12 40 Z" fill={`url(#shadowGrad-${Math.random()})`} opacity="0.4" />
        <Path d="M20 40 Q 20 20 22 5 L 25 40 Z" fill={`url(#shadowGrad-${Math.random()})`} opacity="0.5" />
        <Path d="M20 40 Q 28 25 32 18 L 26 40 Z" fill={`url(#shadowGrad-${Math.random()})`} opacity="0.4" />
        {/* Main blades */}
        <Path d="M20 40 Q 15 25 10 15 L 12 40 Z" fill={`url(#bladeGrad-${Math.random()})`} />
        <Path d="M20 40 Q 20 20 22 5 L 25 40 Z" fill={`url(#bladeGrad-${Math.random()})`} />
        <Path d="M20 40 Q 28 25 32 18 L 26 40 Z" fill={`url(#bladeGrad-${Math.random()})`} />
      </Svg>
    </Animated.View>
  )
}

const SproutSvg = ({ isNight }: { isNight: boolean }) => (
  <G>
    <Ellipse cx="100" cy="230" rx="18" ry="5" fill="rgba(0,0,0,0.15)" />
    {/* Soil mound */}
    <Path
      d="M85 230 Q 100 235 115 230"
      stroke={isNight ? "#3f1d0b" : "#8b5a2b"}
      strokeWidth="2"
      fill="none"
      opacity="0.3"
    />
    {/* Main stem */}
    <Path
      d="M100 230 Q 99 220 100 200 Q 101 180 100 160"
      stroke={isNight ? "#451a03" : "#92400e"}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Leaf 1 */}
    <Path d="M100 200 Q 75 185 70 205 Q 75 210 100 215 Z" fill={isNight ? "#065f46" : "#22c55e"} />
    {/* Leaf 2 */}
    <Path d="M100 210 Q 125 192 135 210 Q 125 215 100 220 Z" fill={isNight ? "#064e3b" : "#16a34a"} />
    {/* New growth leaf */}
    <Path
      d="M100 170 Q 90 160 85 170"
      stroke={isNight ? "#10b981" : "#4ade80"}
      strokeWidth="2"
      fill="none"
      opacity="0.7"
    />
  </G>
)

const SaplingSvg = ({ isNight }: { isNight: boolean }) => (
  <G>
    <Ellipse cx="100" cy="230" rx="30" ry="8" fill="rgba(0,0,0,0.2)" />
    {/* Textured trunk */}
    <Path
      d="M93 230 Q 96 200 95 170 Q 97 140 100 130 L 105 130 Q 108 140 107 170 Q 108 200 107 230 Z"
      fill={isNight ? "#451a03" : "#92400e"}
    />
    {/* Trunk details */}
    <Path
      d="M96 180 L 94 175 M104 180 L 106 175"
      stroke={isNight ? "#3f1d0b" : "#78350f"}
      strokeWidth="1"
      opacity="0.5"
    />
    {/* Left branch */}
    <Path d="M97 190 L 65 150" stroke={isNight ? "#451a03" : "#92400e"} strokeWidth="3.5" strokeLinecap="round" />
    {/* Right branch */}
    <Path d="M103 185 L 135 145" stroke={isNight ? "#451a03" : "#92400e"} strokeWidth="3.5" strokeLinecap="round" />
    {/* Left foliage - overlapping circles for natural look */}
    <Circle cx="60" cy="155" r="18" fill={isNight ? "#065f46" : "#22c55e"} />
    <Circle cx="70" cy="145" r="16" fill={isNight ? "#064e3b" : "#4ade80"} opacity="0.9" />
    <Circle cx="50" cy="145" r="14" fill={isNight ? "#022c22" : "#16a34a"} />
    {/* Right foliage */}
    <Circle cx="140" cy="150" r="19" fill={isNight ? "#065f46" : "#22c55e"} />
    <Circle cx="130" cy="140" r="17" fill={isNight ? "#064e3b" : "#4ade80"} opacity="0.9" />
    <Circle cx="150" cy="140" r="15" fill={isNight ? "#022c22" : "#16a34a"} />
    {/* Center crown */}
    <Circle cx="100" cy="130" r="22" fill={isNight ? "#065f46" : "#4ade80"} />
  </G>
)

const YoungTreeSvg = ({ isNight }: { isNight: boolean }) => (
  <G>
    <Ellipse cx="100" cy="230" rx="50" ry="12" fill="rgba(0,0,0,0.2)" />
    {/* Trunk with slight taper */}
    <Path
      d="M88 230 Q 93 190 95 150 Q 97 110 100 90 L 105 90 Q 108 110 107 150 Q 109 190 112 230 Z"
      fill={isNight ? "#451a03" : "#92400e"}
    />
    {/* Trunk ridges for detail */}
    <Path
      d="M94 160 L 92 140 M106 160 L 108 140"
      stroke={isNight ? "#3f1d0b" : "#78350f"}
      strokeWidth="1.5"
      opacity="0.4"
    />
    {/* Multi-layered foliage for depth and fullness */}
    {/* Bottom layer - widest */}
    <Circle cx="65" cy="150" r="35" fill={isNight ? "#064e3b" : "#15803d"} />
    <Circle cx="135" cy="140" r="36" fill={isNight ? "#064e3b" : "#15803d"} />
    <Circle cx="100" cy="155" r="38" fill={isNight ? "#065f46" : "#16a34a"} />
    {/* Middle layer */}
    <Circle cx="75" cy="110" r="32" fill={isNight ? "#065f46" : "#22c55e"} />
    <Circle cx="125" cy="105" r="33" fill={isNight ? "#065f46" : "#22c55e"} />
    {/* Top layer - crown */}
    <Circle cx="100" cy="75" r="35" fill={isNight ? "#022c22" : "#16a34a"} />
    <Circle cx="85" cy="65" r="30" fill={isNight ? "#065f46" : "#4ade80"} />
    <Circle cx="115" cy="65" r="30" fill={isNight ? "#065f46" : "#4ade80"} />
  </G>
)

const ElderTreeSvg = ({ isNight }: { isNight: boolean }) => (
  <G>
    <Ellipse cx="100" cy="230" rx="70" ry="18" fill="rgba(0,0,0,0.3)" />
    {/* Roots visible above ground */}
    <Path
      d="M70 230 Q 60 238 50 240"
      stroke={isNight ? "#3f1d0b" : "#5d2806"}
      strokeWidth="3.5"
      fill="none"
      opacity="0.7"
    />
    <Path
      d="M130 230 Q 140 238 150 240"
      stroke={isNight ? "#3f1d0b" : "#5d2806"}
      strokeWidth="3.5"
      fill="none"
      opacity="0.7"
    />
    <Path
      d="M100 235 Q 100 242 100 248"
      stroke={isNight ? "#3f1d0b" : "#5d2806"}
      strokeWidth="2.5"
      fill="none"
      opacity="0.6"
    />
    {/* Thick, mature trunk */}
    <Path
      d="M82 230 Q 88 180 90 120 Q 92 60 100 40 L 110 40 Q 118 60 120 120 Q 122 180 118 230 Z"
      fill={isNight ? "#451a03" : "#92400e"}
    />
    {/* Trunk bark texture */}
    <Path
      d="M88 170 Q 86 160 88 150 M112 170 Q 114 160 112 150"
      stroke={isNight ? "#3f1d0b" : "#78350f"}
      strokeWidth="1.5"
      opacity="0.5"
    />
    <Path
      d="M90 200 L 88 190 M110 200 L 112 190"
      stroke={isNight ? "#3f1d0b" : "#78350f"}
      strokeWidth="1"
      opacity="0.4"
    />
    {/* Expansive canopy - multiple overlapping layers */}
    {/* Bottom layer - provides width */}
    <Circle cx="55" cy="130" r="42" fill={isNight ? "#064e3b" : "#15803d"} />
    <Circle cx="145" cy="120" r="42" fill={isNight ? "#064e3b" : "#15803d"} />
    <Circle cx="100" cy="140" r="45" fill={isNight ? "#065f46" : "#16a34a"} />
    {/* Middle layer */}
    <Circle cx="70" cy="85" r="38" fill={isNight ? "#065f46" : "#22c55e"} />
    <Circle cx="130" cy="80" r="38" fill={isNight ? "#065f46" : "#22c55e"} />
    <Circle cx="100" cy="95" r="40" fill={isNight ? "#022c22" : "#16a34a"} />
    {/* Upper layers - create crown shape */}
    <Circle cx="85" cy="50" r="35" fill={isNight ? "#022c22" : "#166534"} />
    <Circle cx="115" cy="50" r="35" fill={isNight ? "#022c22" : "#166534"} />
    <Circle cx="100" cy="35" r="38" fill={isNight ? "#065f46" : "#4ade80"} />
    {/* Top highlight - bright green tip */}
    <Circle cx="100" cy="20" r="28" fill={isNight ? "#10b981" : "#84cc16"} opacity="0.9" />
  </G>
)

const Butterfly = ({ delay, x, y }: { delay: number; x: number; y: number }) => {
  const flutter = useSharedValue(0)
  const float = useSharedValue(0)

  useEffect(() => {
    flutter.value = withRepeat(withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }), -1, true)
    float.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(30, { duration: 3000, easing: Easing.inOut(Easing.sin) })),
        withTiming(-30, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x }, { translateY: y + float.value }, { skewY: `${flutter.value * 20 - 10}deg` }],
  }))

  return (
    <Animated.View style={[styles.butterfly, style]}>
      <Svg width="16" height="12" viewBox="0 0 16 12">
        <Defs>
          <RadialGradient id="wingGrad">
            <Stop offset="0" stopColor="#fbbf24" stopOpacity="1" />
            <Stop offset="1" stopColor="#f59e0b" stopOpacity="0.7" />
          </RadialGradient>
        </Defs>
        {/* Wings */}
        <Circle cx="4" cy="6" r="3.5" fill="url(#wingGrad)" />
        <Circle cx="12" cy="6" r="3.5" fill="url(#wingGrad)" />
        {/* Body */}
        <Path d="M8 2 L 8 10" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />
        {/* Antennae */}
        <Path d="M8 2 Q 5 0 4 1" stroke="#92400e" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <Path d="M8 2 Q 11 0 12 1" stroke="#92400e" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  )
}

const Firefly = ({ delay, x, y }: { delay: number; x: number; y: number }) => {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(0)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withDelay(delay, withTiming(0.9, { duration: 1200 })), withTiming(0.2, { duration: 1200 })),
      -1,
      true,
    )
    translateY.value = withRepeat(
      withTiming(-25, { duration: 2500 + delay, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { translateX: x }, { translateY: y }],
  }))

  return (
    <Animated.View style={[styles.firefly, style]}>
      <Svg width="8" height="8" viewBox="0 0 8 8">
        <Circle cx="4" cy="4" r="3" fill="#fcd34d" />
        <Circle cx="4" cy="4" r="2" fill="#fef08a" />
      </Svg>
    </Animated.View>
  )
}

const Cloud = ({ x, y, isNight }: any) => {
  const drift = useSharedValue(0)

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 8000, easing: Easing.linear }),
        withTiming(-20, { duration: 8000, easing: Easing.linear }),
      ),
      -1,
      true,
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }],
  }))

  const cloudColor = isNight ? "#1e293b" : "#f8fafc"

  return (
    <Animated.View style={[{ position: "absolute", left: x, top: y }, style]}>
      <Svg width="80" height="32" viewBox="0 0 80 32">
        <G>
          <Path
            d="M 15 20 Q 10 20 10 15 Q 10 10 15 10 Q 18 5 25 5 Q 32 5 35 10 Q 45 5 50 5 Q 60 5 65 12 Q 70 10 75 12 Q 78 10 80 15 Q 80 20 75 22 Q 70 25 60 25 Q 50 28 40 28 Q 30 28 20 25 Z"
            fill={cloudColor}
            opacity={isNight ? "0.4" : "0.8"}
          />
        </G>
      </Svg>
    </Animated.View>
  )
}

const LivingTree = ({ streakDays, isNight }: { streakDays: number; isNight: boolean }) => {
  const sway = useSharedValue(0)
  const scale = useSharedValue(0.5)

  const StageComponent = useMemo(() => {
    if (streakDays < 4) return SproutSvg
    if (streakDays < 15) return SaplingSvg
    if (streakDays < 30) return YoungTreeSvg
    return ElderTreeSvg
  }, [streakDays])

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 3700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    )

    scale.value = 0.5
    scale.value = withSpring(1, { damping: 12, mass: 1.2 })
  }, [StageComponent])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value}deg` }, { scale: scale.value }],
  }))

  return (
    <Animated.View style={[styles.treeWrapper, animatedStyle]}>
      <Svg width="200" height="260" viewBox="0 0 200 260">
        <StageComponent isNight={isNight} />
      </Svg>
    </Animated.View>
  )
}

export default function GardenScene({ streakDays = 1 }) {
  const [timeMode, setTimeMode] = useState<"day" | "night">("day")

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours()
      setTimeMode(hour >= 19 || hour < 6 ? "night" : "day")
    }
    checkTime()
    const interval = setInterval(checkTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const skyColors = timeMode === "day" ? ["#87ceeb", "#e0f6ff"] : ["#0f172a", "#1e293b"]
  const hillColors = timeMode === "day" ? ["#2d8659", "#3dac78"] : ["#064e3b", "#0f766e"]

  return (
    <View style={styles.container}>
      {/* Dynamic Sky */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={skyColors[0]} />
              <Stop offset="1" stopColor={skyColors[1]} />
            </LinearGradient>
            <RadialGradient id="sunGrad">
              <Stop offset="0.5" stopColor="#fcd34d" stopOpacity="1" />
              <Stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="moonGrad">
              <Stop offset="0.5" stopColor="#f8fafc" stopOpacity="1" />
              <Stop offset="1" stopColor="#cbd5e1" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Path d={`M0 0 H${width} V350 H0 Z`} fill="url(#skyGrad)" />

          {timeMode === "day" ? (
            <>
              <Circle cx={width - 60} cy="50" r="40" fill="url(#sunGrad)" opacity="0.9" />
            </>
          ) : (
            <>
              <Circle cx={width - 60} cy="50" r="32" fill="url(#moonGrad)" opacity="0.95" />
              {/* Craters on moon */}
              <Circle cx={width - 75} cy="40" r="3.5" fill="#cbd5e1" opacity="0.5" />
              <Circle cx={width - 50} cy="55" r="2.5" fill="#cbd5e1" opacity="0.6" />
            </>
          )}

          {/* Stars night */}
          {timeMode === "night" && (
            <G opacity="0.8">
              <Circle cx="40" cy="35" r="1.8" fill="white" />
              <Circle cx="120" cy="20" r="1.2" fill="white" />
              <Circle cx="240" cy="55" r="1.5" fill="white" />
              <Circle cx="300" cy="30" r="1.3" fill="white" />
              <Circle cx="60" cy="70" r="1.4" fill="white" opacity="0.7" />
            </G>
          )}
        </Svg>
      </View>

      {/* Clouds */}
      <Cloud x={20} y={40} isNight={timeMode === "night"} />
      <Cloud x={width - 100} y={80} isNight={timeMode === "night"} />

      {/* Ambient Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {timeMode === "day" && (
          <>
            <Butterfly delay={0} x={50} y={180} />
            <Butterfly delay={800} x={200} y={220} />
            <Butterfly delay={1600} x={300} y={150} />
          </>
        )}
        {timeMode === "night" && (
          <>
            <Firefly delay={0} x={50} y={200} />
            <Firefly delay={600} x={150} y={220} />
            <Firefly delay={1200} x={250} y={180} />
            <Firefly delay={1800} x={100} y={250} />
          </>
        )}
      </View>

      {/* Rolling Hills */}
      <View style={styles.groundContainer}>
        <Svg height="140" width={width} style={{ position: "absolute", bottom: 0 }}>
          {/* Back hill - darker */}
          <Path d={`M0 70 Q ${width / 2} 30 ${width} 70 V 140 H 0 Z`} fill={hillColors[0]} />
          {/* Front hill - brighter */}
          <Path
            d={`M0 100 Q ${width / 4} 125 ${width / 2} 100 Q ${(3 * width) / 4} 85 ${width} 90 V 140 H 0 Z`}
            fill={hillColors[1]}
          />
        </Svg>
      </View>

      {/* Grass Layers */}
      <View style={styles.grassLayer}>
        {Array.from({ length: 15 }).map((_, i) => (
          <GrassTuft
            key={`back-${i}`}
            x={i * (width / 14) - 10}
            y={i - 5}
            scale={0.8}
            delay={i * 100}
            isNight={timeMode === "night"}
          />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <GrassTuft
            key={`front-${i}`}
            x={i * (width / 19) - 20}
            y={i + 40}
            scale={1.2}
            delay={i * 80}
            isNight={timeMode === "night"}
          />
        ))}
      </View>

      {/* Tree */}
      <View style={styles.sceneContent}>
        <LivingTree streakDays={streakDays} isNight={timeMode === "night"} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  groundContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 140,
  },
  grassLayer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 100,
  },
  sceneContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 0,
    zIndex: 10,
  },
  treeWrapper: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  butterfly: {
    position: "absolute",
    width: 16,
    height: 12,
    shadowColor: "#fbbf24",
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  firefly: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: "#fcd34d",
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  absoluteTuft: {
    position: "absolute",
  },
})
