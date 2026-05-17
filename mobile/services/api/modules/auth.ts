import { apiClient } from "../client";
import { endpoints } from "../endpoints";

export type UserPreferences = {
  affirmationVoice?: "gentle" | "motivational" | "spiritual" | "direct";
  focusTopics?: string[];
  ritualReminderTime?: string; // e.g., "08:00"
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  onboarded: boolean;
  tier: "free" | "premium";
  streakCount: number;
  lifetimeRitualCount?: number;
  preferences?: UserPreferences;
};

export type AuthDataResponse = {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
};

export type AuthApiResponse = {
  status: string;
  data: AuthDataResponse;
};

export type ProfileApiResponse = {
  status: string;
  data: {
    user: UserProfile;
  };
};

export const authApi = {
  register: (body: { email: string; password?: string; name: string }) => {
    return apiClient.post<AuthApiResponse>(endpoints.auth.register, {
      ...body,
      password: body.password || "DefaultPass123", // secure fallback password for demo shell
    });
  },
  login: (body: { email: string; password?: string }) => {
    return apiClient.post<AuthApiResponse>(endpoints.auth.login, {
      ...body,
      password: body.password || "DefaultPass123",
    });
  },
  logout: () => {
    return apiClient.post<{ status: string }>(endpoints.auth.logout);
  },
  getMe: () => {
    return apiClient.get<ProfileApiResponse>(endpoints.auth.me);
  },
  completeOnboarding: (preferences: UserPreferences) => {
    return apiClient.post<ProfileApiResponse>(endpoints.auth.onboarding, { preferences });
  },
};
