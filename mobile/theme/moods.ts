/**
 * Visual tokens for mood pills — mirrors backend MoodLog enum.
 * Presentation only; no logging logic.
 */
export const moodVisuals = {
  Anxious: {
    label: "Anxious",
    color: "#a78bfa",
    glow: "rgba(167, 139, 250, 0.35)",
    gradient: ["#4c1d95", "#6d28d9"] as const,
  },
  Happy: {
    label: "Happy",
    color: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.35)",
    gradient: ["#b45309", "#f59e0b"] as const,
  },
  Tired: {
    label: "Tired",
    color: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.3)",
    gradient: ["#334155", "#64748b"] as const,
  },
  Sad: {
    label: "Sad",
    color: "#60a5fa",
    glow: "rgba(96, 165, 250, 0.35)",
    gradient: ["#1e3a8a", "#3b82f6"] as const,
  },
  Excited: {
    label: "Excited",
    color: "#f472b6",
    glow: "rgba(244, 114, 182, 0.35)",
    gradient: ["#9d174d", "#ec4899"] as const,
  },
  Calm: {
    label: "Calm",
    color: "#2dd4bf",
    glow: "rgba(45, 212, 191, 0.35)",
    gradient: ["#0f766e", "#14b8a6"] as const,
  },
  Frustrated: {
    label: "Frustrated",
    color: "#fb923c",
    glow: "rgba(251, 146, 60, 0.35)",
    gradient: ["#9a3412", "#ea580c"] as const,
  },
  Hopeful: {
    label: "Hopeful",
    color: "#4ade80",
    glow: "rgba(74, 222, 128, 0.35)",
    gradient: ["#166534", "#22c55e"] as const,
  },
  Overwhelmed: {
    label: "Overwhelmed",
    color: "#c084fc",
    glow: "rgba(192, 132, 252, 0.35)",
    gradient: ["#581c87", "#a855f7"] as const,
  },
  Grateful: {
    label: "Grateful",
    color: "#d4a574",
    glow: "rgba(212, 165, 116, 0.4)",
    gradient: ["#78350f", "#d97706"] as const,
  },
} as const;

export type MoodKey = keyof typeof moodVisuals;

export const moodKeys = Object.keys(moodVisuals) as MoodKey[];
