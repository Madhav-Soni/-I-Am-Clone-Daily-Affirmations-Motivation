import { colors } from "./tokens";
import type { AppTheme } from "./types";

export const darkTheme: AppTheme = {
  mode: "dark",
  colors: {
    ...colors,
    surface: {
      base: colors.luxury.midnight,
      elevated: colors.surface.elevated,
      muted: colors.surface.muted,
    },
  },
};
