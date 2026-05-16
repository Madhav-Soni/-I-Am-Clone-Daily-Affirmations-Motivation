import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { duration } from "@/theme/motion";

type UseFloatOptions = {
  amplitude?: number;
  durationMs?: number;
  delayMs?: number;
};

/**
 * Gentle vertical float — hero logos, titles, parallax layers.
 */
export function useFloat(options: UseFloatOptions = {}) {
  const { amplitude = 8, durationMs = duration.celebration * 1.4, delayMs = 0 } = options;
  const translateY = useSharedValue(0);

  useEffect(() => {
    const start = () => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-amplitude, {
            duration: durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(amplitude, {
            duration: durationMs,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    };

    if (delayMs > 0) {
      const timer = setTimeout(start, delayMs);
      return () => clearTimeout(timer);
    }
    start();
  }, [amplitude, delayMs, durationMs, translateY]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
}
