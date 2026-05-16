/**
 * Secure token storage wrapper.
 * Implementation will use expo-secure-store in the auth phase.
 */
export const secureStorage = {
  getItem: async (_key: string): Promise<string | null> => null,
  setItem: async (_key: string, _value: string): Promise<void> => undefined,
  removeItem: async (_key: string): Promise<void> => undefined,
};

export const storageKeys = {
  accessToken: "iamwell.accessToken",
  refreshToken: "iamwell.refreshToken",
} as const;
