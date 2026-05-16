import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import {
  gradientPresets,
  type GradientPreset,
} from "@/theme/gradients";

type CinematicBackgroundProps = ViewProps & {
  preset?: GradientPreset;
  children?: ReactNode;
};

/**
 * Full-bleed cinematic gradient layer.
 * Pair with AmbientBlobBackground for depth.
 */
export function CinematicBackground({
  preset = "aurora",
  style,
  children,
  ...props
}: CinematicBackgroundProps) {
  const config = gradientPresets[preset];

  return (
    <View style={[StyleSheet.absoluteFill, style]} {...props}>
      <LinearGradient
        colors={[...config.colors]}
        locations={config.locations ? [...config.locations] : undefined}
        start={config.start}
        end={config.end}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle vignette for cinematic depth */}
      <LinearGradient
        colors={["transparent", "rgba(3, 5, 8, 0.55)"]}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
