import { TextStyle } from "react-native";

export const fontFamily = {
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansBold: "DMSans_700Bold",
  display: "Cormorant_500Medium",
  displaySemiBold: "Cormorant_600SemiBold",
  displayBold: "Cormorant_700Bold",
} as const;

export type TypographyVariant =
  | "displayLg"
  | "display"
  | "headline"
  | "title"
  | "body"
  | "bodyMedium"
  | "caption"
  | "label"
  | "overline"
  | "affirmation";

type TypographyStyle = Pick<
  TextStyle,
  "fontSize" | "lineHeight" | "letterSpacing" | "fontFamily" | "fontWeight"
>;

export const typography: Record<TypographyVariant, TypographyStyle> = {
  displayLg: {
    fontFamily: fontFamily.displayBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 0,
  },
  title: {
    fontFamily: fontFamily.sansBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  bodyMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
  },
  overline: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
  },
  affirmation: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 40,
    letterSpacing: 0.3,
  },
};

export const textColor = {
  primary: "#f8fafc",
  secondary: "#cbd5e1",
  muted: "#94a3b8",
  faint: "#64748b",
  accent: "#c4b5fd",
  gold: "#e8d4b8",
} as const;
