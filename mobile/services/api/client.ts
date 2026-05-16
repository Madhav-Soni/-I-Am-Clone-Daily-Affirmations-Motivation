import Constants from "expo-constants";

/**
 * Base API URL from app config / environment.
 * HTTP client implementation will be added in the API integration phase.
 */
export const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export type ApiClient = {
  get: <T>(path: string, init?: RequestInit) => Promise<T>;
  post: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  patch: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  delete: <T>(path: string, init?: RequestInit) => Promise<T>;
};

/** Placeholder — replace with fetch + auth interceptor in API phase. */
export const apiClient: ApiClient = {
  get: async () => {
    throw new Error("apiClient.get not implemented");
  },
  post: async () => {
    throw new Error("apiClient.post not implemented");
  },
  patch: async () => {
    throw new Error("apiClient.patch not implemented");
  },
  delete: async () => {
    throw new Error("apiClient.delete not implemented");
  },
};
