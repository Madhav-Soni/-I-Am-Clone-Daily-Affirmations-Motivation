import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { slideUpFooter } from "@/animations/presets";
import { PrimaryButton } from "@/shared/components/primitives/Button";

type FloatingContinueBarProps = {
  label: string;
  onPress: () => void;
  visible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  bottomInset?: number;
  children?: ReactNode;
};

/**
 * Floating CTA anchored above safe area with soft fade scrim.
 */
export function FloatingContinueBar({
  label,
  onPress,
  visible = true,
  disabled = false,
  loading = false,
  bottomInset = 0,
  children,
}: FloatingContinueBarProps) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  const bottom = Math.max(insets.bottom, 12) + bottomInset;

  return (
    <Animated.View
      entering={slideUpFooter}
      style={[styles.wrap, { paddingBottom: bottom }]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={["transparent", "rgba(3, 5, 8, 0.85)", "rgba(3, 5, 8, 0.98)"]}
        locations={[0, 0.35, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={styles.inner}>
        {children}
        <PrimaryButton fullWidth size="lg" onPress={onPress} disabled={disabled} loading={loading}>
          {label}
        </PrimaryButton>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    top: -40,
  },
  inner: {
    gap: 10,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
});
