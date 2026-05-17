import { apiClient } from "../client";
import { endpoints } from "../endpoints";
import { AffirmationResponse } from "./affirmations";

export type TodaySessionResponse = {
  latestAffirmation: AffirmationResponse | null;
  recentMood: {
    _id: string;
    mood: string;
    intensity: number;
    note?: string;
    createdAt: string;
  } | null;
  emotionalContinuityMessage: string;
  streakState: number;
  compassionRecoveryState: boolean;
  lifetimeRituals: number;
  ritualCompletionToday: boolean;
  timeOfDayTone: "morning" | "afternoon" | "evening" | "night";
  reflectionCallback: string | null;
  suggestedEmotionalDirection: string;
};

export type SessionApiResponse = {
  status: string;
  data: TodaySessionResponse;
};

export const sessionApi = {
  getTodaySession: (localHour?: number) => {
    const url = localHour !== undefined 
      ? `${endpoints.session.today}?localHour=${localHour}`
      : endpoints.session.today;
    return apiClient.get<SessionApiResponse>(url);
  },
};
