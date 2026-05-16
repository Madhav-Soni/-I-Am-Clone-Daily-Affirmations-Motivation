import React from "react";
import { ScrollView, Pressable, View } from "react-native";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";

type FilterType = "all" | "category" | "mood";

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
    <View className="mb-6">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 px-4">
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
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
      className={`mr-3 px-4 py-2 rounded-full border ${
        active ? "bg-brand-500 border-brand-400" : "bg-white/5 border-white/10"
      }`}
    >
      <Text className={`text-xs font-medium ${active ? "text-white" : "text-white/60"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
