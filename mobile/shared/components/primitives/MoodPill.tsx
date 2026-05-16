import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { usePressAnimation } from "@/animations/hooks";
import { staggerItem } from "@/animations/presets";
import { Text } from "@/shared/components/primitives/Text";
import { moodVisuals, type MoodKey } from "@/theme/moods";
import { duration } from "@/theme/motion";
import { radius } from "@/theme/tokens";

type MoodPillProps = {
  mood: MoodKey;
  selected?: boolean;
  onPress?: () => void;
  index?: number;
  disabled?: boolean;
};

export function MoodPill({
  mood,
  selected = false,
  onPress,
  index = 0,
  disabled = false,
}: MoodPillProps) {
  const visual = moodVisuals[mood];
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation({ disabled });
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (selected) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.035, {
            duration: duration.celebration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(1, {
            duration: duration.celebration,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: duration.celebration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(glowOpacity);
      pulseScale.value = withTiming(1, { duration: duration.fast });
      glowOpacity.value = withTiming(0, { duration: duration.fast });
    }
  }, [glowOpacity, pulseScale, selected]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View entering={staggerItem(index)} style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || !onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Animated.View style={pulseStyle}>
          {selected ? (
            <Animated.View
              style={[
                styles.glowRing,
                { shadowColor: visual.color, backgroundColor: visual.glow },
                glowStyle,
              ]}
              pointerEvents="none"
            />
          ) : null}
          <View
            style={[
              styles.outer,
              selected && {
                borderColor: visual.color,
                shadowColor: visual.color,
                shadowOpacity: 0.5,
                shadowRadius: 16,
              },
            ]}
          >
            {selected ? (
              <LinearGradient
                colors={[visual.gradient[0], visual.gradient[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.unselectedFill]} />
            )}
            <View style={styles.dotRow}>
              <View style={[styles.dot, { backgroundColor: visual.color }]} />
              <Text
                variant="caption"
                color={selected ? "primary" : "secondary"}
                style={selected ? styles.selectedLabel : undefined}
              >
                {visual.label}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  outer: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  unselectedFill: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedLabel: {
    fontWeight: "600",
  },
});
