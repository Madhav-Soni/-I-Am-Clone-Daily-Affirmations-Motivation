import { useQuery } from "@tanstack/react-query";
import { affirmationsApi, type GetAffirmationsParams } from "@/services/api/modules/affirmations";
import { offlineCache } from "@/services/storage/offlineCache";
import { useEffect, useState } from "react";

export function useAffirmations(params: GetAffirmationsParams = {}) {
  const query = useQuery({
    queryKey: ["affirmations", params],
    queryFn: async () => {
      const response = await affirmationsApi.getAffirmations(params);
      if (response?.data) {
        await offlineCache.saveCachedLibrary(response.data);
      }
      return response;
    },
    select: (data) => data.data,
  });

  const [cachedData, setCachedData] = useState<any>(null);

  useEffect(() => {
    if (query.isError || (!query.isLoading && !query.data)) {
      offlineCache.getCachedLibrary().then((cache) => {
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

export function useAffirmation(id: string) {
  return useQuery({
    queryKey: ["affirmation", id],
    queryFn: () => affirmationsApi.getAffirmation(id),
    select: (data) => data.data.affirmation,
    enabled: !!id,
  });
}
