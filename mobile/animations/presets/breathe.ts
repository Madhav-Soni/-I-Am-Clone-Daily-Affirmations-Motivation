import {
  Easing,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { duration, easing } from "@/theme/motion";

/** Opacity breathe cycle for ambient elements */
export const breatheOpacity = (min = 0.35, max = 0.85) =>
  withRepeat(
    withSequence(
      withTiming(max, { duration: duration.celebration, easing: easing.breathe }),
      withTiming(min, { duration: duration.celebration, easing: easing.breathe })
    ),
    -1,
    true
  );

/** Scale breathe for blobs and glow orbs */
export const breatheScale = (min = 0.92, max = 1.08) =>
  withRepeat(
    withSequence(
      withTiming(max, { duration: duration.celebration * 1.2, easing: Easing.inOut(Easing.sin) }),
      withTiming(min, { duration: duration.celebration * 1.2, easing: Easing.inOut(Easing.sin) })
    ),
    -1,
    true
  );

/** Slow drift offset for floating blobs */
export const driftOffset = (distance: number) =>
  withRepeat(
    withSequence(
      withTiming(distance, { duration: duration.celebration * 2, easing: easing.breathe }),
      withTiming(-distance, { duration: duration.celebration * 2, easing: easing.breathe })
    ),
    -1,
    true
  );
