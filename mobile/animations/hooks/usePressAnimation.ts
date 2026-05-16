import { useCallback } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { animatePressIn, animatePressOut } from "@/animations/presets/press";
import { spring } from "@/theme/motion";

type UsePressAnimationOptions = {
  scaleTo?: number;
  disabled?: boolean;
};

export function usePressAnimation(options: UsePressAnimationOptions = {}) {
  const { scaleTo = 0.96, disabled = false } = options;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = animatePressIn();
    opacity.value = withSpring(0.92, spring.snappy);
  }, [disabled, opacity, scale]);

  const onPressOut = useCallback(() => {
    if (disabled) return;
    scale.value = animatePressOut();
    opacity.value = withSpring(1, spring.gentle);
  }, [disabled, opacity, scale]);

  const onPress = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, spring.snappy);
    scale.value = withSpring(1, spring.gentle);
  }, [disabled, scale, scaleTo]);

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
    onPress,
  };
}
