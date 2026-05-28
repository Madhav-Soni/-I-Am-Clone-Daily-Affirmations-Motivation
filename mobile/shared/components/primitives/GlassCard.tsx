import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";
import { fadeInUp } from "@/animations/presets";
import { glass } from "@/theme/glass";
import { radius } from "@/theme/tokens";
import { colors } from "@/theme/tokens";
import { spring } from "@/theme/motion";
import { cn } from "@/shared/utils/cn";

type GlassCardProps = ViewProps & {
  children: ReactNode;
  className?: string;
  intensity?: number;
  animated?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  selected?: boolean;
};

const paddingMap = {
  none: 0,
  sm: 12,
  md: 20,
  lg: 28,
};

export function GlassCard({
  children,
  className,
  intensity = glass.blur.medium,
  animated = true,
  padding = "md",
  style,
  selected = false,
  ...props
}: GlassCardProps) {
  const scale = useSharedValue(1);
  const activeProgress = useSharedValue(0);

  useEffect(() => {
    if (selected) {
      scale.value = withSpring(1.03, spring.snappy);
      activeProgress.value = withTiming(1, { duration: 250 });
    } else {
      scale.value = withSpring(1, spring.gentle);
      activeProgress.value = withTiming(0, { duration: 200 });
    }
  }, [selected]);

  const animatedInnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      borderColor: interpolateColor(
        activeProgress.value,
        [0, 1],
        ["rgba(255, 255, 255, 0.08)", "rgba(56, 189, 248, 0.9)"]
      ),
      backgroundColor: interpolateColor(
        activeProgress.value,
        [0, 1],
        ["rgba(255, 255, 255, 0.03)", "rgba(14, 165, 233, 0.12)"]
      ),
      shadowColor: "#0ea5e9",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: withTiming(selected ? 0.6 : 0, { duration: 250 }),
      shadowRadius: withTiming(selected ? 16 : 0, { duration: 250 }),
      elevation: withTiming(selected ? 6 : 0, { duration: 250 }),
    };
  });

  const inner = (
    <Animated.View
      style={[styles.inner, animatedInnerStyle, { padding: paddingMap[padding] }, style]}
      className={className}
      {...props}
    >
      <BlurView
        intensity={selected ? 70 : intensity}
        tint="dark"
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.highlight} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (!animated) {
    return <View style={styles.wrapper}>{inner}</View>;
  }

  return (
    <Animated.View entering={fadeInUp} style={styles.wrapper}>
      {inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
  },
  inner: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.background,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderTopColor: glass.highlight,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
