import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radius } from "@/theme/tokens";
import { duration } from "@/theme/motion";

/**
 * Floating brand mark — soft glow ring with gentle pulse.
 */
export function WelcomeLogoMark() {
  const glow = useSharedValue(0.7);
  const scale = useSharedValue(1);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.65, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: duration.celebration * 1.1, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: duration.celebration * 1.1, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [glow, scale]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, ringStyle]}>
      <LinearGradient
        colors={[colors.luxury.accentSoft, colors.luxury.teal, colors.luxury.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ring}
      />
      <View style={styles.core}>
        <View style={styles.innerGlow} />
      </View>
    </Animated.View>
  );
}

const MARK_SIZE = 72;

const styles = StyleSheet.create({
  wrap: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: colors.luxury.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: MARK_SIZE / 2,
    opacity: 0.85,
  },
  core: {
    width: MARK_SIZE - 10,
    height: MARK_SIZE - 10,
    borderRadius: (MARK_SIZE - 10) / 2,
    backgroundColor: colors.luxury.midnight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surface.glassBorder,
  },
  innerGlow: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.luxury.accentSoft,
    opacity: 0.9,
    shadowColor: colors.luxury.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
});
