import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";
import type { AffirmationResponse } from "@/services/api/modules/affirmations";
type AffirmationCardProps = {
  affirmation: AffirmationResponse;
  onPress?: () => void;
  index: number;
};

export function AffirmationCard({ affirmation, onPress, index }: AffirmationCardProps) {
  const dateLabel = new Date(affirmation.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      className="mb-[18px]"
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.topRow}>
          {affirmation.mood && (
            <View style={styles.moodPill}>
              <Text style={styles.moodPillText}>
                {affirmation.mood.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>
              {affirmation.category.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.content}>
          "{affirmation.content}"
        </Text>

        <Text style={styles.date}>
          {dateLabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(12, 14, 28, 0.75)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  moodPill: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  moodPillText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#a78bfa",
    fontFamily: "DM-Sans",
  },
  categoryPill: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: "rgba(255, 255, 255, 0.55)",
    fontFamily: "DM-Sans",
  },
  content: {
    fontSize: 19,
    fontFamily: "Cormorant_700Bold",
    fontStyle: "italic",
    lineHeight: 32,
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 20,
  },
  date: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.35)",
    fontFamily: "DM-Sans",
    letterSpacing: 0.5,
  },
});
