import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";

export type GetAffirmationsParams = {
  category?: string;
  mood?: string;
  isFavorite?: boolean;
  page?: number;
  limit?: number;
};

export type AffirmationResponse = {
  _id: string;
  content: string;
  category: string;
  mood?: string;
  note?: string;
  isFavorite: boolean;
  createdAt: string;
  aiMetadata?: {
    model?: string;
    moodContext?: string;
    activePromptRegister?: string;
    activeMetaphorDomain?: string;
    emotionalPhase?: string;
  };
};

export type AffirmationsListResponse = {
  status: string;
  data: {
    affirmations: AffirmationResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

export const affirmationsApi = {
  getAffirmations: async (params: GetAffirmationsParams = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append("category", params.category);
    if (params.mood) query.append("mood", params.mood);
    if (params.isFavorite !== undefined) query.append("isFavorite", String(params.isFavorite));
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    return apiClient.get<AffirmationsListResponse>(
      `${endpoints.affirmations.list}?${query.toString()}`
    );
  },

  getAffirmation: async (id: string) => {
    return apiClient.get<{ status: string; data: { affirmation: AffirmationResponse } }>(
      endpoints.affirmations.detail(id)
    );
  },

  toggleFavorite: async (id: string) => {
    return apiClient.patch<{ status: string; data: { affirmation: AffirmationResponse } }>(
      endpoints.affirmations.detail(id)
    );
  },

  deleteAffirmation: async (id: string) => {
    return apiClient.delete<void>(endpoints.affirmations.detail(id));
  },

  generateAffirmation: async (
    params: {
      category: string;
      mood?: string | null;
      note?: string | null;
      context?: any;
    },
    options?: { signal?: AbortSignal }
  ) => {
    return apiClient.post<{ status: string; data: { affirmation: AffirmationResponse } }>(
      endpoints.ai.generate,
      params,
      { signal: options?.signal }
    );
  },
};
