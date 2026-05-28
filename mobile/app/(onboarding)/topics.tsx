import { useEffect, useState } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";
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
import { spring } from "@/theme/motion";

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

function AnimatedTopicPill({
  topic,
  selected,
  onPress,
}: {
  topic: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const activeProgress = useSharedValue(0);

  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withSpring(1.1, spring.snappy),
        withSpring(1.04, spring.gentle)
      );
      activeProgress.value = withSpring(1, spring.gentle);
    } else {
      scale.value = withSpring(1, spring.gentle);
      activeProgress.value = withSpring(0, spring.gentle);
    }
  }, [selected]);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, spring.snappy);
    opacity.value = withSpring(0.9, spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(selected ? 1.04 : 1, spring.gentle);
    opacity.value = withSpring(1, spring.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      borderColor: interpolateColor(
        activeProgress.value,
        [0, 1],
        ["rgba(255, 255, 255, 0.1)", "rgba(56, 189, 248, 0.9)"]
      ),
      backgroundColor: interpolateColor(
        activeProgress.value,
        [0, 1],
        ["rgba(255, 255, 255, 0.05)", "rgba(56, 189, 248, 0.2)"]
      ),
      shadowColor: "#0ea5e9",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: withSpring(selected ? 0.65 : 0, spring.gentle),
      shadowRadius: withSpring(selected ? 12 : 0, spring.gentle),
      borderRadius: 24,
      borderWidth: 1,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.topicPillInner}
      >
        <Text
          variant="body"
          color={selected ? "primary" : "secondary"}
          style={styles.pillText}
        >
          {topic}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function OnboardingTopicsScreen() {
  const { draft, setDraft } = useOnboardingDraftStore();
  const selectedTopics = draft.topics || [];
  const [loading, setLoading] = useState(false);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setDraft({ topics: selectedTopics.filter((t) => t !== topic) });
    } else {
      setDraft({ topics: [...selectedTopics, topic] });
    }
  };

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(routes.onboarding.voice);
    }, 600);
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
                <AnimatedTopicPill
                  key={topic}
                  topic={topic}
                  selected={isSelected}
                  onPress={() => toggleTopic(topic)}
                />
              );
            })}
          </ScrollView>
        </GlassCard>

        <PrimaryButton
          fullWidth
          size="lg"
          onPress={handleContinue}
          disabled={selectedTopics.length === 0}
          loading={loading}
          loadingText="Preparing..."
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
  topicPillInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  pillText: {
    fontSize: 15,
  },
});
