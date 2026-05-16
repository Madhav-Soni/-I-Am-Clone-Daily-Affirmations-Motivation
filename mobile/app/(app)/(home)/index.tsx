import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { routes } from "@/constants/routes";
import {
  FullscreenScreen,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  Text,
} from "@/shared/components/primitives";

const MILESTONE_PREVIEWS = [3, 7, 14, 30] as const;

export default function HomeScreen() {
  return (
    <FullscreenScreen gradient="aurora" contentClassName="justify-center py-8">
      <Animated.View entering={fadeInUp} style={styles.content}>
        <Text variant="headline" color="primary" align="center" style={styles.title}>
          Your ritual awaits
        </Text>
        <GlassCard padding="lg" animated={false}>
          <Text variant="body" color="secondary" align="center">
            Preview the affirmation reveal — the emotional centerpiece of I AM WELL.
          </Text>
        </GlassCard>
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
            Experience reveal
          </PrimaryButton>
          <View style={styles.milestoneRow}>
            {MILESTONE_PREVIEWS.map((days) => (
              <View key={days} style={styles.milestoneBtn}>
                <SecondaryButton
                  fullWidth
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: routes.modals.streakCelebration,
                      params: { days: String(days) },
                    })
                  }
                >
                  {days}d streak
                </SecondaryButton>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 28,
  },
  title: {
    marginBottom: 8,
  },
  cta: {
    marginTop: 8,
    gap: 12,
  },
  milestoneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  milestoneBtn: {
    width: "48%",
    flexGrow: 1,
  },
});
