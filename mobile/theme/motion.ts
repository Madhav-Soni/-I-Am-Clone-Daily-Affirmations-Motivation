import { Easing } from "react-native-reanimated";

export const duration = {
  instant: 100,
  fast: 180,
  standard: 320,
  slow: 520,
  cinematic: 720,
  celebration: 960,
} as const;

export const easing = {
  standard: Easing.bezier(0.25, 0.1, 0.25, 1),
  enter: Easing.bezier(0, 0, 0.2, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
  emphasize: Easing.bezier(0.2, 0.8, 0.2, 1),
  breathe: Easing.inOut(Easing.sin),
} as const;

export const spring = {
  gentle: { damping: 22, stiffness: 160, mass: 1 },
  snappy: { damping: 18, stiffness: 220, mass: 0.9 },
  soft: { damping: 26, stiffness: 140, mass: 1.1 },
} as const;
