/**
 * TanStack Query key factory.
 * Extend per feature when API modules are implemented.
 */
export const queryKeys = {
  user: ["user"] as const,
  stats: ["stats"] as const,
  mood: {
    all: ["mood"] as const,
    latest: () => [...queryKeys.mood.all, "latest"] as const,
    history: (filters?: Record<string, unknown>) =>
      [...queryKeys.mood.all, "history", filters ?? {}] as const,
  },
  affirmations: {
    all: ["affirmations"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.affirmations.all, "list", filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.affirmations.all, "detail", id] as const,
  },
} as const;
