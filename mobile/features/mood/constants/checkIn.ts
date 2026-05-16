import type { BlobConfig } from "@/shared/components/visual/AmbientBlobBackground";
import type { MoodKey } from "@/theme/moods";
import { colors } from "@/theme/tokens";

export const CHECK_IN_BLOBS: BlobConfig[] = [
  {
    color: colors.luxury.teal,
    size: 300,
    top: "-12%",
    left: "-20%",
    drift: 8,
    delay: 0,
  },
  {
    color: colors.luxury.accent,
    size: 220,
    top: "40%",
    left: "75%",
    drift: 6,
    delay: 500,
  },
  {
    color: colors.brand[400],
    size: 180,
    top: "75%",
    left: "5%",
    drift: 7,
    delay: 900,
  },
];

export const CHECK_IN_COPY = {
  prompt: "How are you\narriving today?",
  promptSub: "There is no wrong answer — only honesty.",
  reflectionPrompt: "Anything you'd like\nto release?",
  reflectionSub: "Optional — a few words for yourself.",
  notePlaceholder: "I'm noticing…",
  continue: "Continue",
  complete: "Save check-in",
  skipNote: "Skip for now",
} as const;

/** Static affirmation hints — preview only until AI is wired */
export const MOOD_AFFIRMATION_HINTS: Record<MoodKey, string> = {
  Anxious: "Your affirmation will gently steady your breath and soften the noise.",
  Happy: "Your affirmation will celebrate this lightness and help it linger.",
  Tired: "Your affirmation will honor your pace and invite rest without guilt.",
  Sad: "Your affirmation will sit beside you — warm, patient, and unhurried.",
  Excited: "Your affirmation will channel this energy into grounded purpose.",
  Calm: "Your affirmation will deepen the stillness you're already holding.",
  Frustrated: "Your affirmation will acknowledge the fire and guide it forward.",
  Hopeful: "Your affirmation will nurture what's growing beneath the surface.",
  Overwhelmed: "Your affirmation will simplify — one breath, one truth at a time.",
  Grateful: "Your affirmation will reflect this warmth back to you.",
};
