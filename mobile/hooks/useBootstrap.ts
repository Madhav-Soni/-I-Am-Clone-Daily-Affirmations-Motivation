import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store";

/**
 * Bootstrap hook — splash screen and session hydration flags.
 * API session restore will be added in a later phase.
 */
export function useBootstrap() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    const prepare = async () => {
      // Placeholder hydration — marks store ready without API calls.
      useAuthStore.getState().setHydrated(true);
      useAuthStore.getState().setStatus("unauthenticated");
      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    prepare().catch(() => undefined);
  }, []);

  return { isReady };
}
