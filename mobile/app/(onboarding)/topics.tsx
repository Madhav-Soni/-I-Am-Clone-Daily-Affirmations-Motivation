import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { routes } from "@/constants/routes";
import { useOnboardingDraftStore } from "@/store/slices/onboardingDraftSlice";
import {
  DisplayText,
  BodyText,
  FullscreenScreen,
  GlassCard,
  PrimaryButton,
  Text,
} from "@/shared/components/primitives";
import { colors } from "@/theme/tokens";

const TOPICS = [
  "Mindfulness",
  "Gratitude",
  "Confidence",
  "Health",
  "Relationships",
  "Career",
  "Productivity",
  "General",
];

export default function OnboardingTopicsScreen() {
  const { draft, setDraft } = useOnboardingDraftStore();
  const selectedTopics = draft.topics || [];

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setDraft({ topics: selectedTopics.filter((t) => t !== topic) });
    } else {
      setDraft({ topics: [...selectedTopics, topic] });
    }
  };

  return (
    <FullscreenScreen gradient="dusk" contentClassName="justify-center py-6 padded">
      <Animated.View entering={fadeInUp} style={styles.container}>
        <View style={styles.header}>
          <DisplayText color="primary" align="center">Your Focus</DisplayText>
          <BodyText color="secondary" align="center">
            Select the areas you wish to center your affirmations around.
          </BodyText>
        </View>

        <GlassCard padding="md" animated={false}>
          <ScrollView contentContainerStyle={styles.grid} style={styles.scroll}>
            {TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <Pressable
                  key={topic}
                  onPress={() => toggleTopic(topic)}
                  style={[
                    styles.topicPill,
                    isSelected && styles.topicPillSelected,
                  ]}
                >
                  <Text
                    variant="body"
                    color={isSelected ? "primary" : "secondary"}
                    style={styles.pillText}
                  >
                    {topic}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </GlassCard>

        <PrimaryButton
          fullWidth
          size="lg"
          onPress={() => router.push(routes.onboarding.voice)}
          disabled={selectedTopics.length === 0}
        >
          Continue
        </PrimaryButton>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  header: {
    gap: 8,
  },
  scroll: {
    maxHeight: 280,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 8,
  },
  topicPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  topicPillSelected: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: colors.luxury.accentSoft,
  },
  pillText: {
    fontSize: 15,
  },
});
