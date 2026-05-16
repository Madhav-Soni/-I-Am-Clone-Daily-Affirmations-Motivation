import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/theme/tokens";
import { duration } from "@/theme/motion";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type ParticleSpec = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  driftY: number;
  driftX: number;
  delay: number;
};

function Particle({ spec }: { spec: ParticleSpec }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: duration.celebration * 1.4, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.12, { duration: duration.celebration * 1.4, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(-spec.driftY, { duration: duration.celebration * 2.2, easing: Easing.inOut(Easing.sin) }),
          withTiming(spec.driftY, { duration: duration.celebration * 2.2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    translateX.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(spec.driftX, { duration: duration.celebration * 2.6, easing: Easing.inOut(Easing.sin) }),
          withTiming(-spec.driftX, { duration: duration.celebration * 2.6, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [opacity, spec.delay, spec.driftX, spec.driftY, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: spec.x,
          top: spec.y,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function buildParticles(count: number): ParticleSpec[] {
  const palette = [
    colors.luxury.gold,
    colors.luxury.accentSoft,
    colors.luxury.rose,
    colors.luxury.teal,
  ];

  return Array.from({ length: count }, (_, id) => ({
    id,
    x: Math.random() * SCREEN_W,
    y: Math.random() * SCREEN_H * 0.85,
    size: 2 + Math.random() * 4,
    color: palette[id % palette.length],
    driftY: 6 + Math.random() * 10,
    driftX: 4 + Math.random() * 8,
    delay: id * 180,
  }));
}

export function SoftParticles({ count = 18 }: { count?: number }) {
  const particles = useMemo(() => buildParticles(count), [count]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((spec) => (
        <Particle key={spec.id} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
