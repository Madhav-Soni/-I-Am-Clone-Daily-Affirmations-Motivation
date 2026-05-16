import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { Text, DisplayText } from "@/shared/components/primitives/Text";
import { useAffirmation } from "@/features/library/hooks/useAffirmations";
import { RevealCloseButton } from "@/features/affirmation/components/RevealCloseButton";
import { Button } from "@/shared/components/primitives/Button";
import { REVEAL_BLOBS } from "@/features/affirmation/constants/reveal";
import Animated, { FadeIn } from "react-native-reanimated";

export default function AffirmationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: affirmation, isLoading } = useAffirmation(id!);

  if (isLoading || !affirmation) {
    return (
      <FullscreenScreen gradient="void">
        <View className="flex-1 justify-center items-center">
          <Text color="muted">Loading your truth...</Text>
        </View>
      </FullscreenScreen>
    );
  }

  return (
    <FullscreenScreen gradient="void" blobConfigs={REVEAL_BLOBS} padded={false}>
      <View style={styles.header}>
        <RevealCloseButton onPress={() => router.back()} />
      </View>

      <Animated.View entering={FadeIn.duration(800)} className="flex-1">
        <ScrollView contentContainerStyle={styles.content}>
          <View className="mb-8">
            <View className="bg-brand-500/10 self-start px-3 py-1 rounded-full border border-brand-500/20 mb-6">
              <Text variant="label" className="tracking-widest uppercase text-brand-400">
                {affirmation.category}
              </Text>
            </View>

            <DisplayText className="text-4xl leading-[52px] font-serif italic text-white/95 mb-10">
              "{affirmation.content}"
            </DisplayText>

            {affirmation.note && (
              <View className="bg-white/5 rounded-3xl p-8 border border-white/5">
                <Text variant="caption" color="muted" className="uppercase tracking-widest mb-4">
                  Your Reflection
                </Text>
                <Text variant="body" className="text-xl leading-8 text-white/80 italic">
                  {affirmation.note}
                </Text>
              </View>
            )}

            {affirmation.mood && (
              <View className="mt-10 flex-row items-center">
                <Text variant="caption" color="muted" className="mr-3">
                  MOOD WHEN SAVED:
                </Text>
                <View className="bg-luxury-accent/10 px-3 py-1 rounded-full border border-luxury-accent/20">
                  <Text variant="label" className="text-luxury-accent uppercase">
                    {affirmation.mood}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <View className="p-8 pb-12 flex-row gap-4">
        <View className="flex-1">
          <Button
            variant="primary"
            onPress={() => {
              router.push({
                pathname: "/(modals)/share-affirmation",
                params: {
                  content: affirmation.content,
                  category: affirmation.category,
                  mood: affirmation.mood,
                  note: affirmation.note,
                  timestamp: affirmation.createdAt,
                },
              });
            }}
          >
            Share
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="ghost" onPress={() => router.back()}>
            Close
          </Button>
        </View>
      </View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
  },
});
