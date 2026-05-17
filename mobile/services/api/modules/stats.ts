import { apiClient } from "../client";
import { endpoints } from "../endpoints";

export type UserStatsResponse = {
  streak: {
    current: number;
    lifetimeRituals: number;
    lastActiveAt: string | null;
  };
  affirmations: {
    total: number;
    favorites: number;
    categoryBreakdown: { _id: string; count: number }[];
  };
  dailyUsage: {
    used: number;
    limit: number;
    tier: string;
    resetsAt: string;
  };
  moodSummary: {
    totalLogs: number;
    last30Days: Array<{
      _id: string;
      mood: string;
      intensity: number;
      note?: string;
      createdAt: string;
    }>;
  };
};

export type StatsApiResponse = {
  status: string;
  data: UserStatsResponse;
};

export const statsApi = {
  getUserStats: () => {
    return apiClient.get<StatsApiResponse>(endpoints.stats);
  },
};
