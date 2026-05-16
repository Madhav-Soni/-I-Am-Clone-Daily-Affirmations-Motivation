import { useQuery } from "@tanstack/react-query";
import { affirmationsApi, type GetAffirmationsParams } from "@/services/api/modules/affirmations";

export function useAffirmations(params: GetAffirmationsParams = {}) {
  return useQuery({
    queryKey: ["affirmations", params],
    queryFn: () => affirmationsApi.getAffirmations(params),
    select: (data) => data.data,
  });
}

export function useAffirmation(id: string) {
  return useQuery({
    queryKey: ["affirmation", id],
    queryFn: () => affirmationsApi.getAffirmation(id),
    select: (data) => data.data.affirmation,
    enabled: !!id,
  });
}
