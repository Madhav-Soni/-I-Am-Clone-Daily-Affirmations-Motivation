import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { revealStreakEnter } from "@/features/affirmation/animations/revealEntrance";
import { REVEAL_COPY } from "@/features/affirmation/constants/reveal";
import { GlassCard } from "@/shared/components/primitives/GlassCard";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";

export function StreakRewardTeaser() {
  return (
    <Animated.View entering={revealStreakEnter} style={styles.wrap}>
      <GlassCard animated={false} padding="md" intensity={40}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="flame" size={22} color={colors.luxury.gold} />
          </View>
          <View style={styles.copy}>
            <Text variant="label" color="gold" style={styles.label}>
              {REVEAL_COPY.streakLabel}
            </Text>
            <Text variant="caption" color="secondary">
              {REVEAL_COPY.streakBody}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212, 165, 116, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 165, 116, 0.25)",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    letterSpacing: 1.6,
  },
});
