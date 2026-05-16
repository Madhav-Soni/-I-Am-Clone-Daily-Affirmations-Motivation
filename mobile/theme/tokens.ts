/**
 * Core design tokens — dark luxury wellness aesthetic.
 */
export const colors = {
  luxury: {
    void: "#030508",
    midnight: "#070b14",
    deep: "#0c1222",
    plum: "#14102a",
    indigo: "#1e1b4b",
    accent: "#8b5cf6",
    accentSoft: "#a78bfa",
    teal: "#2dd4bf",
    tealMuted: "#14b8a6",
    gold: "#d4a574",
    goldMuted: "#b8956a",
    rose: "#f472b6",
  },
  brand: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    900: "#0c4a6e",
  },
  surface: {
    base: "#070b14",
    elevated: "#121a2e",
    muted: "#1e293b",
    glass: "rgba(255, 255, 255, 0.06)",
    glassBorder: "rgba(255, 255, 255, 0.12)",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    muted: "#94a3b8",
    faint: "#64748b",
  },
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.16)",
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  "2xl": 36,
  full: 9999,
} as const;

export const shadows = {
  glow: {
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
