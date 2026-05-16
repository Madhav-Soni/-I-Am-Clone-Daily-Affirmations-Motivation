import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { duration } from "@/theme/motion";

/**
 * Blinking cursor for streaming / typewriter text.
 */
export function useTypewriterCursor(active: boolean) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration.standard, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: duration.standard, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(0, { duration: duration.fast });
    }
  }, [active, opacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { cursorStyle };
}
