import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { routes } from "@/constants/routes";
import {
  DisplayText,
  BodyText,
  FullscreenScreen,
  GlassCard,
  PrimaryButton,
} from "@/shared/components/primitives";

export default function OnboardingIntroScreen() {
  const [loading, setLoading] = useState(false);

  const handleBegin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(routes.onboarding.topics);
    }, 600);
  };

  return (
    <FullscreenScreen gradient="dusk" contentClassName="justify-center py-6 padded">
      <Animated.View entering={fadeInUp} style={styles.container}>
        <View style={styles.header}>
          <DisplayText color="primary" align="center">Welcome to I AM WELL</DisplayText>
          <BodyText color="secondary" align="center">
            A space to breathe, reflect, and cultivate silent strength. Let's customize your companion experience.
          </BodyText>
        </View>

        <GlassCard padding="lg" animated={false}>
          <BodyText color="secondary" align="center" style={styles.body}>
            We will guide you through a few short steps to align your daily rituals with your emotional focus areas.
          </BodyText>
        </GlassCard>

        <PrimaryButton
          fullWidth
          size="lg"
          onPress={handleBegin}
          loading={loading}
        >
          Begin Setup
        </PrimaryButton>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 32,
  },
  header: {
    gap: 16,
  },
  body: {
    lineHeight: 24,
  },
});
