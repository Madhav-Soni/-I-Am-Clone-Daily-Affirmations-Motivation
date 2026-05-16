import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { celebrationFlameEnter } from "@/features/streak/animations/celebrationEntrance";
import { colors } from "@/theme/tokens";
import { duration } from "@/theme/motion";

type StreakFlameHeroProps = {
  milestone: number;
};

export function StreakFlameHero({ milestone }: StreakFlameHeroProps) {
  const glow = useSharedValue(0.5);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: duration.celebration * 1.15, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.98, { duration: duration.celebration * 1.15, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [glow, scale]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={celebrationFlameEnter} style={styles.wrap}>
      <Animated.View style={[styles.halo, glowStyle]} />
      <View style={styles.ring}>
        <Ionicons name="flame" size={44} color={colors.luxury.gold} />
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{milestone}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginBottom: 8,
  },
  halo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.luxury.gold,
    shadowColor: colors.luxury.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212, 165, 116, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 165, 116, 0.35)",
  },
  badge: {
    position: "absolute",
    bottom: 8,
    right: "36%",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.luxury.midnight,
    borderWidth: 1,
    borderColor: colors.luxury.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.luxury.gold,
    fontSize: 13,
    fontWeight: "600",
  },
});
