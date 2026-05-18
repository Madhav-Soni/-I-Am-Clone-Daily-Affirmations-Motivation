import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import { routes } from "@/constants/routes";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useAuthGate } from "@/hooks/useAuthGate";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { Text } from "@/shared/components/primitives/Text";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

export default function BootstrapScreen() {
  const { isReady } = useBootstrap();
  const gate = useAuthGate();

  // Custom luxury heartbeat pulse animation
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [pulseScale, glowOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!isReady || gate === "loading") {
    return (
      <FullscreenScreen gradient="aurora" padded={false} contentClassName="flex-1 justify-center items-center">
        <View style={styles.center}>
          <Animated.View style={[styles.pulseWrapper, pulseStyle]}>
            <Animated.View style={[styles.glowRing, glowStyle]} />
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>✦</Text>
            </View>
          </Animated.View>

          <Text style={styles.title}>S A N C T U A R Y</Text>
          <Text variant="body" color="muted" align="center" style={styles.subtitle}>
            Preparing your sacred space...
          </Text>
        </View>
      </FullscreenScreen>
    );
  }

  if (gate === "auth") {
    return <Redirect href={routes.auth.welcome} />;
  }

  if (gate === "onboarding") {
    return <Redirect href={routes.onboarding.intro} />;
  }

  return <Redirect href={routes.app.home} />;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseWrapper: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  glowRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(251, 191, 36, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.15)",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 24,
    color: "#fbbf24",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 6,
    marginBottom: 8,
    fontFamily: "DM-Sans",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
  },
});
