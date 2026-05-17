import Constants from "expo-constants";
import { secureStorage, storageKeys } from "../storage/secureStorage";

export const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://10.0.2.2:5000/api/v1";

export type ApiClient = {
  get: <T>(path: string, init?: RequestInit) => Promise<T>;
  post: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  patch: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  delete: <T>(path: string, init?: RequestInit) => Promise<T>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const accessToken = await secureStorage.getItem(storageKeys.accessToken);

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login") && !path.includes("/auth/register")) {
    // Attempt token refresh
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry request with new token
      return request<T>(path, init);
    }
  }

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    try {
      const errBody = await response.json();
      errorMessage = errBody.message || errorMessage;
    } catch {
      // Fallback
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const refreshToken = await secureStorage.getItem(storageKeys.refreshToken);
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Clear credentials and force relog if refresh fails
      await secureStorage.removeItem(storageKeys.accessToken);
      await secureStorage.removeItem(storageKeys.refreshToken);
      return false;
    }

    const body = await response.json();
    const { accessToken: newAccess, refreshToken: newRefresh } = body.data;

    await secureStorage.setItem(storageKeys.accessToken, newAccess);
    await secureStorage.setItem(storageKeys.refreshToken, newRefresh);
    return true;
  } catch {
    return false;
  }
}

export const apiClient: ApiClient = {
  get: (path, init) => request(path, { ...init, method: "GET" }),
  post: (path, body, init) =>
    request(path, {
      ...init,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (path, body, init) =>
    request(path, {
      ...init,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (path, init) => request(path, { ...init, method: "DELETE" }),
};
