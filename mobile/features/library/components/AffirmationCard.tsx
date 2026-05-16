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
      className="mb-6"
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="bg-brand-500/10 px-2 py-1 rounded-full border border-brand-500/20">
            <Text className="text-[10px] font-medium tracking-wider uppercase text-brand-400">
              {affirmation.category}
            </Text>
          </View>
          {affirmation.mood && (
            <View className="bg-luxury-accent/10 px-2 py-1 rounded-full border border-luxury-accent/20">
              <Text className="text-[10px] font-medium tracking-wider uppercase text-luxury-accent">
                {affirmation.mood}
              </Text>
            </View>
          )}
        </View>

        <Text variant="h3" className="mb-4 leading-8 font-serif italic text-white/90">
          "{affirmation.content}"
        </Text>

        {affirmation.note ? (
          <View className="mb-4 border-l-2 border-brand-500/30 pl-3 py-1">
            <Text variant="body" color="muted" numberOfLines={2} className="italic">
              {affirmation.note}
            </Text>
          </View>
        ) : null}

        <View className="flex-row justify-between items-center mt-auto pt-4 border-t border-white/5">
          <Text variant="caption" color="muted">
            {dateLabel}
          </Text>
          <View className="flex-row items-center">
            {/* Action buttons could go here */}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
});
