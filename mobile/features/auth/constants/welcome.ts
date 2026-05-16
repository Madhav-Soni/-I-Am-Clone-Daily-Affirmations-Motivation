import type { BlobConfig } from "@/shared/components/visual/AmbientBlobBackground";
import { colors } from "@/theme/tokens";

/** Slower, softer blobs for the welcome atmosphere */
export const WELCOME_BLOBS: BlobConfig[] = [
  {
    color: colors.luxury.accent,
    size: 340,
    top: "-18%",
    left: "-28%",
    drift: 9,
    delay: 0,
  },
  {
    color: colors.luxury.teal,
    size: 260,
    top: "28%",
    left: "72%",
    drift: 7,
    delay: 600,
  },
  {
    color: colors.luxury.gold,
    size: 200,
    top: "78%",
    left: "8%",
    drift: 6,
    delay: 1200,
  },
  {
    color: colors.luxury.rose,
    size: 140,
    top: "48%",
    left: "-12%",
    drift: 8,
    delay: 300,
  },
];

export const WELCOME_COPY = {
  title: "I AM WELL",
  tagline: "A quiet moment of belief,\nmade for you.",
  affirmationLabel: "A whisper for today",
  affirmation:
    "I am worthy of peace, clarity, and gentle confidence — exactly as I am, right now.",
  ctaPrimary: "Begin your journey",
  ctaSecondary: "I already have an account",
} as const;
