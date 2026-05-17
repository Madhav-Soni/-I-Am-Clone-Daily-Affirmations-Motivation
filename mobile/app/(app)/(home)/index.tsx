import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
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
import { useUserStats } from "@/features/profile/hooks/useUserStats";
import { useAffirmations } from "@/features/library/hooks/useAffirmations";
import { contextComposer } from "@/services/ai/contextComposer";

export default function HomeScreen() {
  const { data: statsData } = useUserStats();
  const { data: affirmationsData } = useAffirmations({ limit: 5 });

  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    if (hour >= 18 && hour < 22) return "Good evening";
    return "Good night";
  }, []);

  const greeting = useMemo(() => {
    const recentAffirmations = affirmationsData?.affirmations || [];
    const recentMoods = statsData?.moodSummary?.last30Days || [];
    return contextComposer.generateHomeGreeting(recentAffirmations, recentMoods);
  }, [affirmationsData, statsData]);

  const recentAffirmation = affirmationsData?.affirmations?.[0];

  return (
    <FullscreenScreen gradient="aurora" contentClassName="justify-center py-8">
      <Animated.View entering={fadeInUp} style={styles.content}>
        <View style={styles.header}>
          <Text variant="caption" color="muted" align="center" className="uppercase tracking-[3px]">
            {timeOfDay}
          </Text>
          <Text variant="displayLg" color="primary" align="center" style={styles.title}>
            {greeting}
          </Text>
        </View>

        {recentAffirmation ? (
          <GlassCard padding="lg" animated={false}>
            <Text variant="body" color="secondary" align="center" style={styles.quote}>
              "{recentAffirmation.content}"
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
                params: { category: "General" },
              })
            }
          >
            Begin today's ritual
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
