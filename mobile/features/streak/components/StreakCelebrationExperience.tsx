import { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import {
  celebrationBloom,
  celebrationCopyEnter,
  celebrationCtaEnter,
  celebrationMilestoneEnter,
} from "@/features/streak/animations/celebrationEntrance";
import {
  CELEBRATION_BLOBS,
  CELEBRATION_COPY,
  createMockStreakData,
  MILESTONE_COPY,
  progressToNextMilestone,
} from "@/features/streak/constants/celebration";
import { SoftParticles } from "@/features/streak/components/SoftParticles";
import { StreakFlameHero } from "@/features/streak/components/StreakFlameHero";
import { StreakProgressRing } from "@/features/streak/components/StreakProgressRing";
import { RevealCloseButton } from "@/features/affirmation/components/RevealCloseButton";
import { FullscreenScreen, GlassCard, PrimaryButton, Text } from "@/shared/components/primitives";
import { hapticSuccess } from "@/shared/lib/haptics";

import { COMPASSION_COPY } from "@/features/streak/constants/celebration";

type StreakCelebrationExperienceProps = {
  streakDays?: number;
  lifetimeRituals?: number;
  compassionRecovery?: boolean;
};

export function StreakCelebrationExperience({ streakDays, lifetimeRituals, compassionRecovery }: StreakCelebrationExperienceProps) {
  const data = useMemo(() => createMockStreakData(streakDays, lifetimeRituals, compassionRecovery), [streakDays, lifetimeRituals, compassionRecovery]);
  
  const isRecovery = data.compassionRecovery;
  const copy = isRecovery ? COMPASSION_COPY : MILESTONE_COPY[data.milestone];
  const ringProgress = progressToNextMilestone(data);

  useEffect(() => {
    const timer = setTimeout(() => {
      void hapticSuccess();
    }, 520);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(home)");
    }
  }, []);

  return (
    <FullscreenScreen
      gradient={isRecovery ? "aurora" : "ember"}
      blobConfigs={CELEBRATION_BLOBS}
      padded={false}
      contentClassName="flex-1"
    >
      <SoftParticles />
      <View style={styles.header}>
        <RevealCloseButton onPress={handleDismiss} />
      </View>

      <Animated.View entering={celebrationBloom} style={styles.body}>
        {!isRecovery && <StreakFlameHero milestone={data.milestone} />}

        <Animated.View entering={celebrationCopyEnter} style={styles.copyBlock}>
          <Text variant="overline" color="gold" align="center" style={styles.overline}>
            {copy.overline}
          </Text>
          <Text variant="display" color="primary" align="center" style={styles.headline}>
            {copy.headline}
          </Text>
          <GlassCard animated={false} padding="lg" intensity={44}>
            <Text variant="body" color="secondary" align="center" style={styles.reinforcement}>
              {copy.reinforcement}
            </Text>
          </GlassCard>
        </Animated.View>

        {!isRecovery && <StreakProgressRing data={data} progress={ringProgress} />}

        <Animated.View entering={celebrationMilestoneEnter} style={styles.milestoneWrap}>
          <GlassCard animated={false} padding="md" intensity={36}>
            <Text variant="caption" color="accent" align="center">
              {isRecovery 
                ? COMPASSION_COPY.milestoneMessage(data.lifetimeRituals)
                : (copy as any).milestoneMessage}
            </Text>
          </GlassCard>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={celebrationCtaEnter} style={styles.footer}>
        <PrimaryButton fullWidth size="lg" onPress={handleDismiss}>
          {CELEBRATION_COPY.continue}
        </PrimaryButton>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    gap: 8,
    zIndex: 1,
  },
  copyBlock: {
    gap: 16,
    marginBottom: 8,
  },
  overline: {
    letterSpacing: 2.2,
    marginBottom: 4,
  },
  headline: {
    lineHeight: 38,
    marginBottom: 4,
  },
  reinforcement: {
    lineHeight: 26,
  },
  milestoneWrap: {
    marginTop: 4,
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 2,
  },
});
