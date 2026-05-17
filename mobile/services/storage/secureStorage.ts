import * as SecureStore from "expo-secure-store";

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Silently fail if secure store fails
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Silently fail if secure store fails
    }
  },
};

export const storageKeys = {
  accessToken: "iamwell.accessToken",
  refreshToken: "iamwell.refreshToken",
  onboarded: "iamwell.onboarded",
  deviceId: "iamwell.deviceId",
} as const;
