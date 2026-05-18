import { useQuery } from "@tanstack/react-query";
import { sessionApi } from "@/services/api/modules/session";
import { offlineCache } from "@/services/storage/offlineCache";
import { useEffect, useState } from "react";

export function useTodaySession() {
  const localHour = new Date().getHours();

  const query = useQuery({
    queryKey: ["session", "today"],
    queryFn: async () => {
      const response = await sessionApi.getTodaySession(localHour);
      if (response?.data) {
        await offlineCache.saveCachedHomeState(response.data);
      }
      return response;
    },
    select: (data) => data.data,
  });

  const [cachedData, setCachedData] = useState<any>(null);

  // Hydrate from offline cache if network call fails
  useEffect(() => {
    if (query.isError || (!query.isLoading && !query.data)) {
      offlineCache.getCachedHomeState().then((cache) => {
        if (cache) {
          setCachedData(cache);
        }
      });
    }
  }, [query.isError, query.isLoading, query.data]);

  return {
    ...query,
    data: query.data || cachedData,
    isOffline: !!(!query.data && cachedData),
  };
}
