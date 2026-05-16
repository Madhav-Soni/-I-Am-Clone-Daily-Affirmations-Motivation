import type { BlobConfig } from "@/shared/components/visual/AmbientBlobBackground";
import type { MoodKey } from "@/theme/moods";
import { colors } from "@/theme/tokens";

export const REVEAL_BLOBS: BlobConfig[] = [
  {
    color: colors.luxury.accent,
    size: 360,
    top: "-20%",
    left: "-30%",
    drift: 10,
    delay: 0,
  },
  {
    color: colors.brand[400],
    size: 280,
    top: "30%",
    left: "68%",
    drift: 8,
    delay: 400,
  },
  {
    color: colors.luxury.teal,
    size: 200,
    top: "70%",
    left: "5%",
    drift: 7,
    delay: 800,
  },
  {
    color: colors.luxury.gold,
    size: 150,
    top: "50%",
    left: "-8%",
    drift: 9,
    delay: 200,
  },
];

export const REVEAL_COPY = {
  anticipation: "Preparing something just for you…",
  thinking: "Listening to how you feel",
  reflection: "Take a breath. Let it land.",
  save: "Save to library",
  share: "Share",
  done: "Done",
  streakLabel: "Your ritual continues",
  streakBody: "Day 4 — you're building something beautiful.",
} as const;

const CATEGORY_AFFIRMATIONS: Record<string, string[]> = {
  General: [
    "I am allowed to move slowly. My worth is not measured by my pace, and peace is already finding me.",
  ],
  Confidence: [
    "I carry a quiet strength within me. I have overcome before, and I am capable of meeting whatever comes next.",
  ],
  Calm: [
    "I release what I cannot control. With each breath, I return to a stillness that has always been mine.",
  ],
  Gratitude: [
    "I notice the small mercies woven through my day. Gratitude softens my heart and opens me to joy.",
  ],
};

const MOOD_AFFIRMATIONS: Partial<Record<MoodKey, string>> = {
  Anxious:
    "I am safe in this moment. The storm in my mind can soften, and I breathe with gentleness until it does.",
  Calm:
    "I honor the stillness I have cultivated. This calm is not fragile — it lives in me, even when life moves fast.",
  Sad:
    "I allow my feelings without judgment. I am held by my own compassion, and healing moves at its own pace.",
  Hopeful:
    "Something tender is growing in me. I trust the direction I am facing, even when the path is not fully clear.",
  Grateful:
    "I receive this day with an open heart. Abundance surrounds me in forms I am learning to recognize.",
  Overwhelmed:
    "I simplify. One breath, one truth, one step — that is enough for right now, and right now is all I need.",
};

export function pickMockAffirmation(category?: string | null, mood?: MoodKey | null): string {
  if (mood && MOOD_AFFIRMATIONS[mood]) {
    return MOOD_AFFIRMATIONS[mood]!;
  }
  const key = category && CATEGORY_AFFIRMATIONS[category] ? category : "General";
  const pool = CATEGORY_AFFIRMATIONS[key] ?? CATEGORY_AFFIRMATIONS.General;
  return pool[0];
}

export const REVEAL_TIMING = {
  anticipationMs: 1000,
  thinkingMs: 2600,
  reflectionMs: 2000,
  streakDelayMs: 800,
  chunkMs: 42,
  chunkSize: 2,
} as const;
