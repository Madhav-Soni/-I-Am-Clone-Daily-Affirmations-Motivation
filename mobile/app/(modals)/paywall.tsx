import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { GlassCard } from "@/shared/components/primitives/GlassCard";
import { PrimaryButton, GhostButton } from "@/shared/components/primitives/Button";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import { useAuthStore } from "@/store";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

export default function PaywallModal() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const handleUpgrade = () => {
    void hapticSuccess();
    if (user) {
      setUser({ ...user, tier: "premium" });
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(home)");
    }
  };

  const handleClose = () => {
    void hapticLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(home)");
    }
  };

  return (
    <FullscreenScreen gradient="dusk" padded={false} contentClassName="flex-1 justify-center px-6">
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={styles.preTitle}>✦ SANCTUARY UNLIMITED ✦</Text>
        <Text variant="displayLg" align="center" style={styles.title}>
          Deepen Your Practice
        </Text>
        <Text variant="body" color="muted" align="center" style={styles.subtitle}>
          Expand your daily wellness space with premium spiritual resonance.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <GlassCard padding="lg" animated={false}>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✦</Text>
              <View>
                <Text style={styles.featureLabel}>Unlimited Daily Generations</Text>
                <Text style={styles.featureSub}>Generate as many personalized intentions as you need.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✦</Text>
              <View style={styles.featureItemText}>
                <Text style={styles.featureLabel}>Longitudinal Emotional Memory</Text>
                <Text style={styles.featureSub}>AI evolves by tracking your emotional phases and trajectory.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✦</Text>
              <View>
                <Text style={styles.featureLabel}>Premium Registers & Metaphors</Text>
                <Text style={styles.featureSub}>Access advanced poetic themes, somatic phrasing, and grounding cycles.</Text>
              </View>
            </View>
          </View>

          <View style={styles.pricingCard}>
            <Text style={styles.pricingPrice}>$4.99 / month</Text>
            <Text style={styles.pricingDesc}>Start with a 14-day free Sanctuary trial. Cancel anytime.</Text>
          </View>

          <PrimaryButton onPress={handleUpgrade} size="lg" fullWidth>
            Activate 14-Day Free Trial
          </PrimaryButton>

          <View style={{ height: 8 }} />

          <GhostButton onPress={handleClose} size="md" fullWidth>
            Sit in Stillness (Close)
          </GhostButton>
        </GlassCard>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  preTitle: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#d97706",
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: "DM-Sans",
  },
  title: {
    fontSize: 32,
    fontFamily: "Cormorant_700Bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  features: {
    gap: 20,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: "row",
    gap: 16,
  },
  featureItemText: {
    flex: 1,
  },
  featureIcon: {
    fontSize: 16,
    color: "#d97706",
    marginTop: 2,
  },
  featureLabel: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    fontFamily: "DM-Sans",
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.35)",
    fontFamily: "DM-Sans",
    lineHeight: 16,
    paddingRight: 24,
  },
  pricingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    marginBottom: 24,
  },
  pricingPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "DM-Sans",
    marginBottom: 4,
  },
  pricingDesc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    fontFamily: "DM-Sans",
  },
});
