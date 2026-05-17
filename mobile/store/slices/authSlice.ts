import { create } from "zustand";
import { UserProfile } from "@/services/api/modules/auth";
import { secureStorage, storageKeys } from "@/services/storage/secureStorage";

export type AuthStatus = "idle" | "hydrating" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  isHydrated: boolean;
  user: UserProfile | null;
  isOnboarded: boolean;
  setStatus: (status: AuthStatus) => void;
  setHydrated: (hydrated: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setOnboarded: (onboarded: boolean) => void;
  login: (user: UserProfile, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
};

const initialState = {
  status: "idle" as AuthStatus,
  isHydrated: false,
  user: null,
  isOnboarded: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  setUser: (user) => set({ user, isOnboarded: user?.onboarded ?? false }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  login: async (user, accessToken, refreshToken) => {
    await secureStorage.setItem(storageKeys.accessToken, accessToken);
    await secureStorage.setItem(storageKeys.refreshToken, refreshToken);
    await secureStorage.setItem(storageKeys.onboarded, String(user.onboarded));
    set({
      status: "authenticated",
      user,
      isOnboarded: user.onboarded,
    });
  },
  logout: async () => {
    await secureStorage.removeItem(storageKeys.accessToken);
    await secureStorage.removeItem(storageKeys.refreshToken);
    await secureStorage.removeItem(storageKeys.onboarded);
    set({
      status: "unauthenticated",
      user: null,
      isOnboarded: false,
    });
  },
  reset: () => set(initialState),
}));
