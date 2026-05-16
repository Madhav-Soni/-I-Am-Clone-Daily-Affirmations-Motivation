import { colors } from "./tokens";

export const glass = {
  blur: {
    light: 24,
    medium: 40,
    heavy: 64,
  },
  background: colors.surface.glass,
  backgroundHover: "rgba(255, 255, 255, 0.09)",
  border: colors.surface.glassBorder,
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  highlight: "rgba(255, 255, 255, 0.04)",
} as const;
