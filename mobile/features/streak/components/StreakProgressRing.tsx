import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { celebrationRingEnter } from "@/features/streak/animations/celebrationEntrance";
import { CELEBRATION_COPY } from "@/features/streak/constants/celebration";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";
import { duration } from "@/theme/motion";
import type { MockStreakData } from "@/features/streak/constants/celebration";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 168;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type StreakProgressRingProps = {
  data: MockStreakData;
  progress: number;
};

export function StreakProgressRing({ data, progress }: StreakProgressRingProps) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: duration.cinematic,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  const nextLabel = data.nextMilestone
    ? `${data.currentStreak} / ${data.nextMilestone} ${CELEBRATION_COPY.dayPlural}`
    : `${data.currentStreak} ${CELEBRATION_COPY.dayPlural}`;

  return (
    <Animated.View entering={celebrationRingEnter} style={styles.wrap}>
      <GlassRingBackdrop />
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
          fill="transparent"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.luxury.gold}
          strokeWidth={STROKE}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text variant="title" color="gold" style={styles.days}>
          {data.currentStreak}
        </Text>
        <Text variant="caption" color="muted">
          {data.currentStreak === 1 ? CELEBRATION_COPY.daySingular : CELEBRATION_COPY.dayPlural}
        </Text>
      </View>
      <Text variant="caption" color="faint" align="center" style={styles.progressCaption}>
        {CELEBRATION_COPY.progressLabel}
      </Text>
      <Text variant="label" color="secondary" align="center">
        {nextLabel}
      </Text>
    </Animated.View>
  );
}

function GlassRingBackdrop() {
  return <View style={styles.backdrop} />;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  backdrop: {
    position: "absolute",
    width: SIZE + 24,
    height: SIZE + 24,
    borderRadius: (SIZE + 24) / 2,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.surface.glassBorder,
    top: 0,
  },
  svg: {
    marginTop: 12,
  },
  center: {
    position: "absolute",
    top: 12,
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  days: {
    fontSize: 36,
    lineHeight: 40,
  },
  progressCaption: {
    marginTop: 4,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontSize: 10,
  },
});
