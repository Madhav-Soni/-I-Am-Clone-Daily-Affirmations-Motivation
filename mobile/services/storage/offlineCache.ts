import { secureStorage } from "./secureStorage";
import { errorMonitor } from "../monitoring/errorMonitor";

const CACHE_KEYS = {
  homeState: "iamwell.cache.homeState",
  library: "iamwell.cache.library",
};

export const offlineCache = {
  saveCachedHomeState: async (data: any): Promise<void> => {
    try {
      if (!data) return;
      await secureStorage.setItem(CACHE_KEYS.homeState, JSON.stringify(data));
    } catch (err: any) {
      errorMonitor.logError(err, { source: "saveCachedHomeState" });
    }
  },

  getCachedHomeState: async (): Promise<any | null> => {
    try {
      const raw = await secureStorage.getItem(CACHE_KEYS.homeState);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err: any) {
      errorMonitor.logError(err, { source: "getCachedHomeState" });
      return null;
    }
  },

  saveCachedLibrary: async (data: any): Promise<void> => {
    try {
      if (!data) return;
      await secureStorage.setItem(CACHE_KEYS.library, JSON.stringify(data));
    } catch (err: any) {
      errorMonitor.logError(err, { source: "saveCachedLibrary" });
    }
  },

  getCachedLibrary: async (): Promise<any | null> => {
    try {
      const raw = await secureStorage.getItem(CACHE_KEYS.library);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err: any) {
      errorMonitor.logError(err, { source: "getCachedLibrary" });
      return null;
    }
  },
};
