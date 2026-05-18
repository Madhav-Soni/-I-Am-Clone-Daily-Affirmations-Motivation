import React, { useState, useCallback } from "react";
import { View, FlatList, RefreshControl, StyleSheet, Platform } from "react-native";
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
          <View style={styles.cardContainer}>
            <AffirmationCard
              affirmation={item}
              index={index}
              onPress={() => handleCardPress(item._id)}
            />
          </View>
        )}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.headerTextWrapper}>
              <Text variant="displayLg" style={styles.headerTitle}>
                Library
              </Text>
              <Text variant="body" color="muted" style={styles.headerSubtitle}>
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
        contentContainerStyle={styles.flatListContent}
      />
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === "android" ? 36 : 16, // Proportional safe top spacing for Android status bar compatibility
    marginBottom: 8,
  },
  headerTextWrapper: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontFamily: "Cormorant_700Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  cardContainer: {
    paddingHorizontal: 24,
  },
  flatListContent: {
    paddingBottom: 120,
  },
});
