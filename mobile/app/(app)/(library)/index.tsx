import React, { useState, useCallback } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { Text } from "@/shared/components/primitives/Text";
import { useAffirmations } from "@/features/library/hooks/useAffirmations";
import { AffirmationCard } from "@/features/library/components/AffirmationCard";
import { LibraryFilters } from "@/features/library/components/LibraryFilters";
import { EmptyLibrary } from "@/features/library/components/EmptyLibrary";
import { colors } from "@/theme/tokens";

import { router } from "expo-router";

export default function LibraryScreen() {
  const [category, setCategory] = useState<string | undefined>();
  const [mood, setMood] = useState<string | undefined>();

  const { data, isLoading, refetch, isRefetching } = useAffirmations({
    category,
    mood,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCardPress = (id: string) => {
    router.push(`/(app)/(library)/${id}`);
  };

  const affirmations = data?.affirmations || [];

  return (
    <FullscreenScreen gradient="void" padded={false}>
      <FlatList
        data={affirmations}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <View className="px-6">
            <AffirmationCard
              affirmation={item}
              index={index}
              onPress={() => handleCardPress(item._id)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="pt-16 mb-6">
            <View className="px-6 mb-8">
              <Text variant="displayLg" className="text-4xl mb-2 font-serif">
                Library
              </Text>
              <Text variant="body" color="muted">
                Your collection of personal truths.
              </Text>
            </View>
            <LibraryFilters
              selectedCategory={category}
              onSelectCategory={setCategory}
              selectedMood={mood}
              onSelectMood={setMood}
            />
          </View>
        }
        ListEmptyComponent={!isLoading ? <EmptyLibrary /> : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.brand[500]}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </FullscreenScreen>
  );
}
