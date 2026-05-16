import { useAuthStore } from "@/store";

export type AuthGateResult = "loading" | "auth" | "onboarding" | "app";

/**
 * Auth gate stub — returns loading until session hydration is implemented.
 */
export function useAuthGate(): AuthGateResult {
  const status = useAuthStore((s) => s.status);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated || status === "idle" || status === "hydrating") {
    return "loading";
  }

  if (status === "unauthenticated") {
    return "auth";
  }

  // Onboarding vs app routing will use user.onboarded from Query cache.
  return "app";
}
