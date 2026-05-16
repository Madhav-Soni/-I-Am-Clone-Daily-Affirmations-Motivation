import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { glass } from "@/theme/glass";
import { radius } from "@/theme/tokens";
import { cn } from "@/shared/utils/cn";

type GlassCardProps = ViewProps & {
  children: ReactNode;
  className?: string;
  intensity?: number;
  animated?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
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
  ...props
}: GlassCardProps) {
  const inner = (
    <View
      style={[styles.inner, { padding: paddingMap[padding] }, style]}
      className={className}
      {...props}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.highlight} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
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
    overflow: "hidden",
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
