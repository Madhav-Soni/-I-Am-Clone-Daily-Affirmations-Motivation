import { useQuery } from "@tanstack/react-query";
import { affirmationsApi, type GetAffirmationsParams } from "@/services/api/modules/affirmations";
import { offlineCache } from "@/services/storage/offlineCache";
import { useEffect, useState } from "react";

const SEED_AFFIRMATIONS = [
  {
    _id: "seed-1",
    content: "I am grounded, capable, and at peace with this present moment.",
    category: "Mindfulness",
    createdAt: new Date().toISOString(),
    aiMetadata: { moodContext: "Anxious" }
  },
  {
    _id: "seed-2",
    content: "My challenges are opportunities to grow into my highest self.",
    category: "Confidence",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    aiMetadata: { moodContext: "Overwhelmed" }
  },
  {
    _id: "seed-3",
    content: "I treat myself with the same kindness and compassion I offer to others.",
    category: "Health",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    aiMetadata: { moodContext: "Sad" }
  },
  {
    _id: "seed-4",
    content: "Every step I take is leading me closer to a life of abundance and joy.",
    category: "General",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    aiMetadata: { moodContext: "Hopeful" }
  },
  {
    _id: "seed-5",
    content: "I release the need for control and trust the natural flow of my life.",
    category: "Mindfulness",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    aiMetadata: { moodContext: "Calm" }
  },
  {
    _id: "seed-6",
    content: "I am worthy of love, success, and deep, lasting connections.",
    category: "Relationships",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    aiMetadata: { moodContext: "Grateful" }
  }
];

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

  const rawData = query.data || cachedData;
  const filteredSeeds = SEED_AFFIRMATIONS.filter(item => {
    const matchCategory = !params.category || item.category.toLowerCase() === params.category.toLowerCase();
    const matchMood = !params.mood || item.aiMetadata.moodContext.toLowerCase() === params.mood.toLowerCase();
    return matchCategory && matchMood;
  });

  const resolvedData = {
    success: true,
    affirmations: rawData?.affirmations?.length > 0 ? rawData.affirmations : filteredSeeds
  };

  return {
    ...query,
    data: resolvedData,
    isOffline: !!(!query.data && cachedData),
  };
}

export function useAffirmation(id: string) {
  const isSeed = id?.startsWith("seed-");

  const query = useQuery({
    queryKey: ["affirmation", id],
    queryFn: () => affirmationsApi.getAffirmation(id),
    select: (data) => data?.data?.affirmation,
    enabled: !!id && !isSeed,
  });

  if (isSeed) {
    const seed = SEED_AFFIRMATIONS.find(item => item._id === id);
    return {
      data: seed ? {
        _id: seed._id,
        content: seed.content,
        category: seed.category,
        mood: seed.aiMetadata.moodContext,
        note: "Sitting with this intention brought a wave of quiet reflection.",
        createdAt: seed.createdAt,
      } : null,
      isLoading: false,
    };
  }

  return query;
}
