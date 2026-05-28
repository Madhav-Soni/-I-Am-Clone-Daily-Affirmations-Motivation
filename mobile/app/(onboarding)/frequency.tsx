import { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { routes } from "@/constants/routes";
import { useOnboardingDraftStore } from "@/store/slices/onboardingDraftSlice";
import {
  DisplayText,
  BodyText,
  FullscreenScreen,
  GlassCard,
  PrimaryButton,
  Text,
} from "@/shared/components/primitives";
import { colors } from "@/theme/tokens";

const FREQUENCIES = [
  { id: 1, label: "Once daily", desc: "A singular centering thought each morning." },
  { id: 3, label: "Three times daily", desc: "Morning alignment, afternoon check-in, evening reflection." },
  { id: 5, label: "Five times daily", desc: "Frequent gentle touchpoints to keep you grounded." },
];

export default function OnboardingFrequencyScreen() {
  const { draft, setDraft } = useOnboardingDraftStore();
  const selectedFreq = draft.dailyFrequency;

  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(routes.onboarding.complete);
    }, 600);
  };

  return (
    <FullscreenScreen gradient="dusk" contentClassName="justify-center py-6 padded">
      <Animated.View entering={fadeInUp} style={styles.container}>
        <View style={styles.header}>
          <DisplayText color="primary" align="center">Daily Frequency</DisplayText>
          <BodyText color="secondary" align="center">
            How often would you like to receive new personalized affirmations?
          </BodyText>
        </View>

        <View style={styles.list}>
          {FREQUENCIES.map((freq) => {
            const isSelected = selectedFreq === freq.id;
            return (
              <Pressable
                key={freq.id}
                onPress={() => setDraft({ dailyFrequency: freq.id })}
              >
                <GlassCard
                  padding="md"
                  animated={false}
                  intensity={isSelected ? 48 : 24}
                  selected={isSelected}
                >
                  <View style={styles.cardContent}>
                    <Text
                      variant="body"
                      color={isSelected ? "primary" : "secondary"}
                      style={styles.label}
                    >
                      {freq.label}
                    </Text>
                    <Text variant="caption" color="muted">
                      {freq.desc}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          fullWidth
          size="lg"
          onPress={handleContinue}
          disabled={!selectedFreq}
          loading={loading}
          loadingText="Preparing..."
        >
          Continue
        </PrimaryButton>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  header: {
    gap: 8,
  },
  list: {
    gap: 12,
  },
  selectedCard: {
    borderColor: colors.luxury.accentSoft,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  cardContent: {
    gap: 4,
  },
  label: {
    fontWeight: "600",
  },
});
