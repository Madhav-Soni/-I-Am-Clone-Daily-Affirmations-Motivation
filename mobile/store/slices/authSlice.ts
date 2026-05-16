import { create } from "zustand";

export type AuthStatus = "idle" | "hydrating" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  isHydrated: boolean;
  setStatus: (status: AuthStatus) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
};

const initialState = {
  status: "idle" as AuthStatus,
  isHydrated: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  reset: () => set(initialState),
}));
