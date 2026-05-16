import type { BlobConfig } from "@/shared/components/visual/AmbientBlobBackground";
import { colors } from "@/theme/tokens";

export type MilestoneDay = 3 | 7 | 14 | 30;

export const MILESTONE_DAYS: MilestoneDay[] = [3, 7, 14, 30];

export type MockStreakData = {
  currentStreak: number;
  milestone: MilestoneDay;
  previousMilestone: MilestoneDay | null;
  nextMilestone: MilestoneDay | null;
};

export const CELEBRATION_BLOBS: BlobConfig[] = [
  {
    color: colors.luxury.gold,
    size: 320,
    top: "-15%",
    left: "-25%",
    drift: 6,
    delay: 0,
  },
  {
    color: colors.luxury.accentSoft,
    size: 240,
    top: "55%",
    left: "70%",
    drift: 5,
    delay: 600,
  },
  {
    color: colors.luxury.rose,
    size: 160,
    top: "78%",
    left: "8%",
    drift: 4,
    delay: 300,
  },
];

export const CELEBRATION_COPY = {
  continue: "Continue your ritual",
  progressLabel: "Toward your next milestone",
  daySingular: "day",
  dayPlural: "days",
} as const;

type MilestoneCopy = {
  overline: string;
  headline: string;
  reinforcement: string;
  milestoneMessage: string;
};

export const MILESTONE_COPY: Record<MilestoneDay, MilestoneCopy> = {
  3: {
    overline: "A gentle beginning",
    headline: "Three days of showing up",
    reinforcement:
      "You've returned to yourself three times. That consistency is already planting something real.",
    milestoneMessage: "The first threads of a ritual are forming. Keep going softly.",
  },
  7: {
    overline: "One full week",
    headline: "Seven days of presence",
    reinforcement:
      "A week of intention. You're proving that care for yourself can be steady, not perfect.",
    milestoneMessage: "Your rhythm is finding its shape. This is how change becomes natural.",
  },
  14: {
    overline: "Two weeks strong",
    headline: "Fourteen days of devotion",
    reinforcement:
      "Fourteen mornings or evenings where you chose reflection over rush. That matters deeply.",
    milestoneMessage: "You're building a sanctuary inside your routine. Honor that.",
  },
  30: {
    overline: "A luminous month",
    headline: "Thirty days of grace",
    reinforcement:
      "Thirty days of returning. You have woven belief into your life in a way that will stay with you.",
    milestoneMessage: "This is mastery of presence — quiet, warm, and entirely yours.",
  },
};

/** Mock streak payload — replace with API stats later */
export function createMockStreakData(streakDays?: number): MockStreakData {
  const current = streakDays ?? 7;
  const milestone = resolveMilestone(current);
  const milestoneIndex = MILESTONE_DAYS.indexOf(milestone);
  const previousMilestone = milestoneIndex > 0 ? MILESTONE_DAYS[milestoneIndex - 1] : null;
  const nextMilestone =
    milestoneIndex < MILESTONE_DAYS.length - 1 ? MILESTONE_DAYS[milestoneIndex + 1] : null;

  return {
    currentStreak: current,
    milestone,
    previousMilestone,
    nextMilestone,
  };
}

export function resolveMilestone(days: number): MilestoneDay {
  if (days >= 30) return 30;
  if (days >= 14) return 14;
  if (days >= 7) return 7;
  if (days >= 3) return 3;
  return 3;
}

export function progressToNextMilestone(data: MockStreakData): number {
  if (!data.nextMilestone) return 1;
  return Math.min(1, Math.max(0.08, data.currentStreak / data.nextMilestone));
}
