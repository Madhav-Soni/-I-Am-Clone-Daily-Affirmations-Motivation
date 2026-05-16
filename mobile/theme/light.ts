import { colors } from "./tokens";
import type { AppTheme } from "./types";

export const lightTheme: AppTheme = {
  mode: "light",
  colors: {
    ...colors,
    surface: {
      base: "#f8fafc",
      elevated: "#ffffff",
      muted: "#e2e8f0",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      muted: "#94a3b8",
    },
    border: "#e2e8f0",
  },
};
