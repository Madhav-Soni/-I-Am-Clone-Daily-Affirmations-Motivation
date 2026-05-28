import React, { useEffect } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Text } from "@/shared/components/primitives/Text";
import { colors, radius } from "@/theme/tokens";
import { spring } from "@/theme/motion";

type LibraryFiltersProps = {
  selectedCategory?: string;
  onSelectCategory: (category?: string) => void;
  selectedMood?: string;
  onSelectMood: (mood?: string) => void;
};

const CATEGORIES = ["General", "Health", "Confidence", "Mindfulness", "Relationships"];
const MOODS = ["Anxious", "Sad", "Hopeful", "Grateful", "Overwhelmed", "Calm"];

export function LibraryFilters({
  selectedCategory,
  onSelectCategory,
  selectedMood,
  onSelectMood,
}: LibraryFiltersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Category</Text>
      </View>
      <View style={styles.chipsContainer}>
        <FilterChip
          label="All Categories"
          active={!selectedCategory}
          onPress={() => onSelectCategory(undefined)}
        />
        {CATEGORIES.map((cat) => (
          <FilterChip
            key={cat}
            label={cat}
            active={selectedCategory === cat}
            onPress={() => onSelectCategory(cat)}
          />
        ))}
      </View>

      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Mood</Text>
      </View>
      <View style={styles.chipsContainer}>
        <FilterChip
          label="All Moods"
          active={!selectedMood}
          onPress={() => onSelectMood(undefined)}
        />
        {MOODS.map((mood) => (
          <FilterChip
            key={mood}
            label={mood}
            active={selectedMood === mood}
            onPress={() => onSelectMood(mood)}
          />
        ))}
      </View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Smooth scale animation on selection change
  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withSpring(1.1, spring.snappy),
        withSpring(1.04, spring.gentle)
      );
    } else {
      scale.value = withSpring(1, spring.gentle);
    }
  }, [active, scale]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, spring.snappy);
    opacity.value = withSpring(0.9, spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(active ? 1.04 : 1, spring.gentle);
    opacity.value = withSpring(1, spring.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          active ? styles.chipActive : styles.chipInactive,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        {active && (
          <LinearGradient
            colors={["rgba(14, 165, 233, 0.35)", "rgba(2, 132, 199, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
          />
        )}
        <Text
          style={[
            styles.chipText,
            active ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    width: "100%",
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "DM-Sans",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
  },
  chipsContainer: {
    paddingHorizontal: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 42,
    overflow: "hidden",
  },
  chipInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  chipActive: {
    backgroundColor: "rgba(14, 165, 233, 0.18)",
    borderColor: colors.brand[400] || "#38bdf8",
    shadowColor: colors.brand[500] || "#0ea5e9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 8,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "DM-Sans",
    fontWeight: "500",
    textAlign: "center",
  },
  chipTextInactive: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
