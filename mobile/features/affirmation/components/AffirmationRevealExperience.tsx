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
import { useUserStats } from "@/features/profile/hooks/useUserStats";
import { Button } from "@/shared/components/primitives/Button";
import { useAuthStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import { affirmationsApi } from "@/services/api/modules/affirmations";


type AffirmationRevealExperienceProps = {
  category?: string | null;
};

export function AffirmationRevealExperience({ category }: AffirmationRevealExperienceProps) {
  const { phase, partialText, isStreaming, cancel, regenerate, generatedId } = useRevealFlow({ category });
  const resetCheckIn = useCheckInDraftStore((s) => s.reset);
  const [saved, setSaved] = useState(false);
  const { data: statsData } = useUserStats();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const mood = useCheckInDraftStore((s) => s.mood);
  const activeTone = user?.preferences?.affirmationVoice || "gentle";

  const handleDismiss = useCallback(() => {
    cancel();
    resetCheckIn();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(home)");
    }
  }, [cancel, resetCheckIn]);

  const handleSave = async () => {
    try {
      if (generatedId) {
        await affirmationsApi.toggleFavorite(generatedId);
        await queryClient.invalidateQueries({ queryKey: ["affirmations"] });
        setSaved(true);
      }
    } catch (err) {
      console.error("[AffirmationRevealExperience save failed]", err);
    }
  };

  const handleRegenerate = () => {
    void hapticLight();
    setSaved(false);
    regenerate();
  };

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
        {phase === "cooldown" ? (
          <Animated.View entering={FadeIn.duration(800)} style={styles.cooldownContainer}>
            <View style={styles.cooldownIconWrapper}>
              <View style={styles.cooldownIconOuter}>
                <Text style={styles.cooldownIcon}>✦</Text>
              </View>
            </View>
            <Text variant="display" align="center" style={styles.cooldownTitle}>
              You've completed today's reflection.
            </Text>
            <Text variant="body" color="muted" align="center" style={styles.cooldownSubtitle}>
              Sit with the intentions you have set today. Your sanctuary will open again tomorrow.
            </Text>
            
            <View style={styles.cooldownActions}>
              <Button
                onPress={() => {
                  void hapticLight();
                  router.push("/(modals)/paywall");
                }}
                variant="primary"
                fullWidth
              >
                Upgrade to Premium
              </Button>
              <View style={{ height: 12 }} />
              <Button
                onPress={handleDismiss}
                variant="ghost"
                fullWidth
              >
                Close in Stillness
              </Button>
            </View>
          </Animated.View>
        ) : (
          <PhaseContent
            phase={phase}
            partialText={partialText}
            isStreaming={isStreaming}
            showAffirmation={showAffirmation}
            showReflection={showReflection}
            mood={mood || undefined}
            tone={activeTone}
          />
        )}
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
            onSave={handleSave}
            onRegenerate={handleRegenerate}
            onShare={() => {
              router.push({
                pathname: "/(modals)/share-affirmation",
                params: {
                  content: partialText,
                  category: category ?? "General",
                  mood: useCheckInDraftStore.getState().mood ?? undefined,
                  note: useCheckInDraftStore.getState().note ?? undefined,
                },
              });
            }}
            onDone={handleDismiss}
          />
        ) : null}

        {showStreak ? (
          <Pressable
            onPress={() => {
              void hapticLight();
              router.push({
                pathname: routes.modals.streakCelebration,
                params: { 
                  days: statsData?.streak?.current?.toString() || "12",
                  lifetime: statsData?.streak?.lifetimeRituals?.toString() || "37",
                  compassionRecovery: (statsData?.streak?.current === 1 && (statsData?.streak?.lifetimeRituals ?? 0) > 1) ? "true" : "false"
                },
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
  mood?: string;
  tone?: string;
};

function PhaseContent({
  phase,
  partialText,
  isStreaming,
  showAffirmation,
  showReflection,
  mood,
  tone,
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
        mood={mood}
        tone={tone}
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
  cooldownContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cooldownIconWrapper: {
    marginBottom: 24,
  },
  cooldownIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.2)",
  },
  cooldownIcon: {
    fontSize: 24,
    color: "#fbbf24",
  },
  cooldownTitle: {
    fontSize: 28,
    fontFamily: "Cormorant_700Bold",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  cooldownSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginBottom: 36,
  },
  cooldownActions: {
    width: "100%",
  },
});
