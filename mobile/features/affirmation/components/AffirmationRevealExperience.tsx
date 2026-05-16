import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useCheckInDraftStore } from "@/features/mood/store/checkInDraftStore";
import { useRevealFlow, type RevealPhase } from "@/features/affirmation/hooks/useRevealFlow";
import { AnticipationState } from "@/features/affirmation/components/AnticipationState";
import { RevealCloseButton } from "@/features/affirmation/components/RevealCloseButton";
import { RevealActionBar } from "@/features/affirmation/components/RevealActionBar";
import { StreakRewardTeaser } from "@/features/affirmation/components/StreakRewardTeaser";
import { StreamingAffirmation } from "@/features/affirmation/components/StreamingAffirmation";
import { ThinkingIndicator } from "@/features/affirmation/components/ThinkingIndicator";
import { REVEAL_BLOBS, REVEAL_COPY } from "@/features/affirmation/constants/reveal";
import { revealReflectionEnter } from "@/features/affirmation/animations/revealEntrance";
import { routes } from "@/constants/routes";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { hapticLight } from "@/shared/lib/haptics";
import { Text } from "@/shared/components/primitives/Text";

type AffirmationRevealExperienceProps = {
  category?: string | null;
};

export function AffirmationRevealExperience({ category }: AffirmationRevealExperienceProps) {
  const { phase, partialText, isStreaming, cancel } = useRevealFlow({ category });
  const resetCheckIn = useCheckInDraftStore((s) => s.reset);
  const [saved, setSaved] = useState(false);

  const handleDismiss = useCallback(() => {
    cancel();
    resetCheckIn();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(home)");
    }
  }, [cancel, resetCheckIn]);

  const showAffirmation =
    phase === "revealing" || phase === "reflection" || phase === "actions" || phase === "streak";
  const showReflection = phase === "reflection" || phase === "actions" || phase === "streak";
  const showActions = phase === "actions" || phase === "streak";
  const showStreak = phase === "streak";

  return (
    <FullscreenScreen
      gradient="aurora"
      blobConfigs={REVEAL_BLOBS}
      padded={false}
      contentClassName="flex-1"
    >
      <View style={styles.header}>
        <RevealCloseButton onPress={handleDismiss} />
      </View>

      <View style={styles.center}>
        <PhaseContent
          phase={phase}
          partialText={partialText}
          isStreaming={isStreaming}
          showAffirmation={showAffirmation}
          showReflection={showReflection}
        />
      </View>

      <View style={styles.footer}>
        {showReflection && phase === "reflection" ? (
          <Animated.View entering={revealReflectionEnter} style={styles.reflectionCaption}>
            <Text variant="caption" color="muted" align="center">
              {REVEAL_COPY.reflection}
            </Text>
          </Animated.View>
        ) : null}

        {showActions ? (
          <RevealActionBar
            saved={saved}
            onSave={() => setSaved(true)}
            onShare={() => undefined}
            onDone={handleDismiss}
          />
        ) : null}

        {showStreak ? (
          <Pressable
            onPress={() => {
              void hapticLight();
              router.push({
                pathname: routes.modals.streakCelebration,
                params: { days: "7" },
              });
            }}
          >
            <StreakRewardTeaser />
          </Pressable>
        ) : null}

        <View style={styles.bottomPad} />
      </View>
    </FullscreenScreen>
  );
}

type PhaseContentProps = {
  phase: RevealPhase;
  partialText: string;
  isStreaming: boolean;
  showAffirmation: boolean;
  showReflection: boolean;
};

function PhaseContent({
  phase,
  partialText,
  isStreaming,
  showAffirmation,
  showReflection,
}: PhaseContentProps) {
  if (phase === "anticipation") {
    return <AnticipationState />;
  }

  if (phase === "thinking") {
    return <ThinkingIndicator />;
  }

  if (showAffirmation) {
    return (
      <StreamingAffirmation
        text={partialText}
        isStreaming={isStreaming}
        showReflection={showReflection && !isStreaming}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 8,
  },
  reflectionCaption: {
    marginBottom: 4,
  },
  bottomPad: {
    height: 8,
  },
});
