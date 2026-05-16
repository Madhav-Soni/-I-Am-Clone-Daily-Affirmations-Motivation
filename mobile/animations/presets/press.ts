import { withSpring, withTiming } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

export const pressInScale = 0.96;
export const pressOutScale = 1;

export const animatePressIn = () =>
  withSpring(pressInScale, spring.snappy);

export const animatePressOut = () =>
  withSpring(pressOutScale, spring.gentle);

export const animatePressOpacity = (pressed: boolean) =>
  withTiming(pressed ? 0.88 : 1, { duration: duration.fast });
