import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { CinematicBackground } from "@/shared/components/visual/CinematicBackground";
import {
  AmbientBlobBackground,
  type BlobConfig,
} from "@/shared/components/visual/AmbientBlobBackground";
import type { GradientPreset } from "@/theme/gradients";
import { cn } from "@/shared/utils/cn";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

type FullscreenScreenProps = ViewProps & {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  edges?: Edge[];
  gradient?: GradientPreset;
  blobs?: boolean;
  blobConfigs?: BlobConfig[];
  statusBarStyle?: "light" | "dark" | "auto";
  padded?: boolean;
};

/**
 * Primary fullscreen container — cinematic gradient + ambient blobs + safe area.
 */
export function FullscreenScreen({
  children,
  className,
  contentClassName,
  edges = ["top", "bottom"],
  gradient = "aurora",
  blobs = true,
  blobConfigs,
  statusBarStyle = "light",
  padded = true,
  style,
  ...props
}: FullscreenScreenProps) {
  const insets = useSafeAreaInsets();
  
  // Guarantee a minimum safe top padding for translucent status bars
  const paddingTop = edges.includes("top") ? Math.max(insets.top, Platform.OS === "android" ? 38 : 20) : 0;
  const paddingBottom = edges.includes("bottom") ? insets.bottom : 0;

  return (
    <View style={[styles.root, style]} {...props}>
      <StatusBar style={statusBarStyle} />
      <CinematicBackground preset={gradient} />
      {blobs ? <AmbientBlobBackground blobs={blobConfigs} /> : null}
      <View 
        style={[
          styles.safe, 
          { 
            paddingTop, 
            paddingBottom,
            zIndex: 10, 
            elevation: 10 
          }
        ]}
      >
        <View 
          className={cn("flex-1", padded && "px-5", contentClassName, className)}
          style={[styles.flex1, padded && styles.padded]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#030508",
  },
  safe: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
  },
});
