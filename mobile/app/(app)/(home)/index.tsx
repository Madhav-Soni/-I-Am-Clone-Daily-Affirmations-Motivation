import { useMemo } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { routes } from "@/constants/routes";
import {
  FullscreenScreen,
  GlassCard,
  PrimaryButton,
  Text,
} from "@/shared/components/primitives";
import { useTodaySession } from "@/features/profile/hooks/useTodaySession";

export default function HomeScreen() {
  const { data: sessionData, isLoading } = useTodaySession();

  const formattedTimeOfDay = useMemo(() => {
    if (!sessionData?.timeOfDayTone) return "Good day";
    const tone = sessionData.timeOfDayTone;
    return `Good ${tone.charAt(0).toUpperCase() + tone.slice(1)}`;
  }, [sessionData?.timeOfDayTone]);

  if (isLoading) {
    return (
      <FullscreenScreen gradient="aurora" contentClassName="justify-center items-center py-8">
        <ActivityIndicator size="large" color="#ffffff" style={{ opacity: 0.6 }} />
      </FullscreenScreen>
    );
  }

  const latestAffirmation = sessionData?.latestAffirmation;
  const greeting = sessionData?.emotionalContinuityMessage || "Welcome to your personal space.";

  return (
    <FullscreenScreen gradient="aurora" contentClassName="justify-center py-8">
      <Animated.View entering={fadeInUp} style={styles.content}>
        <View style={styles.header}>
          <Text variant="caption" color="muted" align="center" className="uppercase tracking-[3px]">
            {formattedTimeOfDay}
          </Text>
          <Text variant="displayLg" color="primary" align="center" style={styles.title}>
            {greeting}
          </Text>
          {sessionData?.reflectionCallback && (
            <Text variant="caption" color="muted" align="center" className="italic mt-1">
              {sessionData.reflectionCallback}
            </Text>
          )}
        </View>

        {latestAffirmation ? (
          <GlassCard padding="lg" animated={false}>
            <Text variant="body" color="secondary" align="center" style={styles.quote}>
              "{latestAffirmation.content}"
            </Text>
            <Text variant="caption" color="muted" align="center" className="uppercase tracking-[2px] mt-4">
              Continue where you left off
            </Text>
          </GlassCard>
        ) : (
          <GlassCard padding="lg" animated={false}>
            <Text variant="body" color="secondary" align="center">
              Your journey to mindfulness begins here. Take a moment to center yourself.
            </Text>
          </GlassCard>
        )}

        <View style={styles.cta}>
          <PrimaryButton
            fullWidth
            size="lg"
            onPress={() =>
              router.push({
                pathname: routes.modals.affirmationReveal,
                params: { category: sessionData?.suggestedEmotionalDirection || "General" },
              })
            }
          >
            {sessionData?.ritualCompletionToday 
              ? "Revisit today's ritual" 
              : `Begin ritual for ${sessionData?.suggestedEmotionalDirection || "presence"}`}
          </PrimaryButton>
        </View>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
    paddingHorizontal: 12,
  },
  header: {
    gap: 16,
  },
  title: {
    marginBottom: 8,
    lineHeight: 48,
  },
  quote: {
    fontStyle: "italic",
    lineHeight: 28,
  },
  cta: {
    marginTop: 16,
  },
});
