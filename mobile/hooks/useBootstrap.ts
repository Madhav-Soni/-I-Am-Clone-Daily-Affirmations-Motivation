import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store";
import { secureStorage, storageKeys } from "@/services/storage/secureStorage";
import { authApi } from "@/services/api/modules/auth";

export function useBootstrap() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        const token = await secureStorage.getItem(storageKeys.accessToken);
        if (token) {
          try {
            const response = await authApi.getMe();
            if (response?.data?.user) {
              useAuthStore.getState().setUser(response.data.user);
              useAuthStore.getState().setStatus("authenticated");
            } else {
              await useAuthStore.getState().logout();
            }
          } catch {
            // Profile fetch failed, might need to re-auth or refresh
            await useAuthStore.getState().logout();
          }
        } else {
          useAuthStore.getState().setStatus("unauthenticated");
        }
      } catch {
        useAuthStore.getState().setStatus("unauthenticated");
      } finally {
        useAuthStore.getState().setHydrated(true);
        setIsReady(true);
      }
    };

    prepare().catch(() => undefined);
  }, []);

  return { isReady };
}
