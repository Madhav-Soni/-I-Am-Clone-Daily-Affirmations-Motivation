import React from "react";
import { ScrollView, Pressable, View, StyleSheet } from "react-native";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";

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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
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
      </ScrollView>

      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Mood</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
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
      </ScrollView>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive
      ]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    width: "100%",
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "DM-Sans",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingRight: 32, // Extra padding to allow scrolling past final chip cleanly
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chipInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  chipActive: {
    backgroundColor: colors.brand[500] || "#0D9488",
    borderColor: colors.brand[400] || "#14B8A6",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "DM-Sans",
    fontWeight: "500",
  },
  chipTextInactive: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  chipTextActive: {
    color: "#ffffff",
  },
});
