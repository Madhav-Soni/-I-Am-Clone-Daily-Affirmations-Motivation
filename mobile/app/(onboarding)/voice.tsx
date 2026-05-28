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

const VOICES = [
  { id: "gentle", name: "Gentle", desc: "Warm, nurturing, and compassionate — like a caring friend" },
  { id: "motivational", name: "Motivational", desc: "Energetic, powerful, and action-oriented — like a life coach" },
  { id: "spiritual", name: "Spiritual", desc: "Mindful, reflective, and grounded — like a meditation guide" },
  { id: "direct", name: "Direct", desc: "Clear, concise, and pragmatic — like a confident mentor" },
];

export default function OnboardingVoiceScreen() {
  const { draft, setDraft } = useOnboardingDraftStore();
  const selectedVoice = draft.affirmationVoice;

  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(routes.onboarding.frequency);
    }, 600);
  };

  return (
    <FullscreenScreen gradient="dusk" contentClassName="justify-center py-6 padded">
      <Animated.View entering={fadeInUp} style={styles.container}>
        <View style={styles.header}>
          <DisplayText color="primary" align="center">Affirmation Voice</DisplayText>
          <BodyText color="secondary" align="center">
            Choose the cadence and vocal tone for your daily grounding audio session.
          </BodyText>
        </View>

        <View style={styles.list}>
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            return (
              <Pressable
                key={voice.id}
                onPress={() => setDraft({ affirmationVoice: voice.id })}
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
                      style={styles.voiceName}
                    >
                      {voice.name}
                    </Text>
                    <Text variant="caption" color="muted">
                      {voice.desc}
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
          disabled={!selectedVoice}
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
  voiceName: {
    fontWeight: "600",
  },
});
