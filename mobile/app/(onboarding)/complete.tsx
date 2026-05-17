import { useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { routes } from "@/constants/routes";
import { useOnboardingDraftStore } from "@/store/slices/onboardingDraftSlice";
import { useAuthStore } from "@/store";
import { authApi, UserPreferences } from "@/services/api/modules/auth";
import {
  DisplayText,
  BodyText,
  FullscreenScreen,
  GlassCard,
  PrimaryButton,
  Text,
} from "@/shared/components/primitives";

export default function OnboardingCompleteScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { draft, reset: resetDraft } = useOnboardingDraftStore();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const setUser = useAuthStore((s) => s.setUser);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const preferences: UserPreferences = {
        affirmationVoice: (draft.affirmationVoice as any) || "gentle",
        focusTopics: draft.topics || ["General"],
        ritualReminderTime: "08:00",
      };

      const response = await authApi.completeOnboarding(preferences);
      if (response?.data?.user) {
        setUser(response.data.user);
        setOnboarded(true);
        resetDraft();
        router.replace(routes.bootstrap);
      } else {
        setError("Invalid response from server.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to finalize preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FullscreenScreen gradient="dusk" contentClassName="justify-center py-6 padded">
      <Animated.View entering={fadeInUp} style={styles.container}>
        <View style={styles.header}>
          <DisplayText color="primary" align="center">Setup Complete</DisplayText>
          <BodyText color="secondary" align="center">
            Your daily ritual companion is fully aligned with your intentions.
          </BodyText>
        </View>

        <GlassCard padding="lg" animated={false}>
          <View style={styles.summary}>
            {error && (
              <Text variant="caption" color="accent" style={styles.errorText}>
                {error}
              </Text>
            )}
            <Text variant="body" color="secondary" align="center" style={styles.quote}>
              "Presence is not a destination, but a gentle returning to this very moment."
            </Text>
          </View>
        </GlassCard>

        <PrimaryButton
          fullWidth
          size="lg"
          onPress={handleFinish}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : "Enter Sanctuary"}
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
  summary: {
    gap: 12,
  },
  quote: {
    fontStyle: "italic",
    lineHeight: 24,
  },
  errorText: {
    textAlign: "center",
    color: "#ef4444",
  },
});
