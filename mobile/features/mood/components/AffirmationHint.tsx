import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { checkInHintEnter } from "@/features/mood/animations/checkInEntrance";
import { MOOD_AFFIRMATION_HINTS } from "@/features/mood/constants/checkIn";
import { GlassCard } from "@/shared/components/primitives/GlassCard";
import { LabelText, Text } from "@/shared/components/primitives/Text";
import { moodVisuals, type MoodKey } from "@/theme/moods";

type AffirmationHintProps = {
  mood: MoodKey | null;
  visible?: boolean;
};

export function AffirmationHint({ mood, visible = true }: AffirmationHintProps) {
  if (!visible || !mood) {
    return null;
  }

  const hint = MOOD_AFFIRMATION_HINTS[mood];
  const accent = moodVisuals[mood].color;

  return (
    <Animated.View entering={checkInHintEnter}>
      <GlassCard animated={false} padding="md" intensity={36}>
        <View style={styles.row}>
          <View style={[styles.accentBar, { backgroundColor: accent }]} />
          <View style={styles.copy}>
            <LabelText color="accent" style={styles.label}>
              Your affirmation preview
            </LabelText>
            <Text variant="caption" color="secondary" style={styles.hint}>
              {hint}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: "stretch",
    minHeight: 40,
    opacity: 0.9,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  label: {
    letterSpacing: 1.4,
  },
  hint: {
    lineHeight: 20,
  },
});
