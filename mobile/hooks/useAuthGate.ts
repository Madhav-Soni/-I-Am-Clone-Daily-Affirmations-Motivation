import { useAuthStore } from "@/store";

export type AuthGateResult = "loading" | "auth" | "onboarding" | "app";

export function useAuthGate(): AuthGateResult {
  const status = useAuthStore((s) => s.status);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isOnboarded = useAuthStore((s) => s.isOnboarded);

  if (!isHydrated || status === "idle" || status === "hydrating") {
    return "loading";
  }

  if (status === "unauthenticated") {
    return "auth";
  }

  if (!isOnboarded) {
    return "onboarding";
  }

  return "app";
}
