import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { revealThinkingEnter } from "@/features/affirmation/animations/revealEntrance";
import { REVEAL_COPY } from "@/features/affirmation/constants/reveal";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";
import { duration } from "@/theme/motion";

const ORB_SIZE = 88;

function ThinkingOrb({ delay }: { delay: number }) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.88, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.95, { duration: duration.celebration }),
          withTiming(0.35, { duration: duration.celebration })
        ),
        -1,
        true
      )
    );
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { backgroundColor: colors.luxury.accentSoft },
        style,
      ]}
    />
  );
}

export function ThinkingIndicator() {
  const ringScale = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: duration.celebration * 1.3, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: duration.celebration * 1.3, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [ringScale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: 0.35,
  }));

  return (
    <Animated.View entering={revealThinkingEnter} style={styles.wrap}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <View style={styles.orbs}>
        <ThinkingOrb delay={0} />
        <ThinkingOrb delay={400} />
        <ThinkingOrb delay={800} />
      </View>
      <Text variant="caption" color="muted" align="center" style={styles.label}>
        {REVEAL_COPY.thinking}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    minHeight: 200,
  },
  ring: {
    position: "absolute",
    width: ORB_SIZE * 2.2,
    height: ORB_SIZE * 2.2,
    borderRadius: ORB_SIZE * 1.1,
    borderWidth: 1,
    borderColor: colors.luxury.accentSoft,
  },
  orbs: {
    width: ORB_SIZE * 2,
    height: ORB_SIZE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  orb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: colors.luxury.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  label: {
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
