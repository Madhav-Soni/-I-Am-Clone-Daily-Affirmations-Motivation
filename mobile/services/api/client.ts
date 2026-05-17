import Constants from "expo-constants";
import { secureStorage, storageKeys } from "../storage/secureStorage";
import { useAuthStore } from "../../store";

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

// Module-level shared refresh mutex promise
let refreshPromise: Promise<boolean> | null = null;

// Persistent, privacy-safe device ID caching layer
let cachedDeviceId: string | null = null;

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getOrInitDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  let deviceId = await secureStorage.getItem(storageKeys.deviceId);
  if (!deviceId) {
    deviceId = generateUUID();
    await secureStorage.setItem(storageKeys.deviceId, deviceId);
  }
  cachedDeviceId = deviceId;
  return deviceId;
}

async function request<T>(path: string, init?: RequestInit, retryCount = 0): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const accessToken = await secureStorage.getItem(storageKeys.accessToken);
  const deviceId = await getOrInitDeviceId();

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Inject device session context and timezone automatically on every query
  headers.set("x-device-id", deviceId);

  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (deviceTimezone) {
    headers.set("x-timezone", deviceTimezone);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (
    response.status === 401 &&
    retryCount < 1 &&
    !path.includes("/auth/refresh") &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/register")
  ) {
    // Attempt token refresh (threads wait on the same single-flight mutex)
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry request exactly once with new token
      return request<T>(path, init, retryCount + 1);
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
  // If a refresh is already in-flight, subscribe to the existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // Create single-flight refresh task
  refreshPromise = (async () => {
    try {
      const refreshToken = await secureStorage.getItem(storageKeys.refreshToken);
      const deviceId = await getOrInitDeviceId();
      if (!refreshToken) {
        await useAuthStore.getState().logout();
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Clear credentials and force relog statefully if refresh fails
        await useAuthStore.getState().logout();
        return false;
      }

      const body = await response.json();
      const { accessToken: newAccess, refreshToken: newRefresh } = body.data;

      await secureStorage.setItem(storageKeys.accessToken, newAccess);
      await secureStorage.setItem(storageKeys.refreshToken, newRefresh);
      return true;
    } catch (err) {
      await useAuthStore.getState().logout();
      return false;
    } finally {
      // Reset the shared promise mutex when finished
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
