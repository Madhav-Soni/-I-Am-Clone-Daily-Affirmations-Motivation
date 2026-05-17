import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/services/api/modules/stats";

export function useUserStats() {
  return useQuery({
    queryKey: ["user", "stats"],
    queryFn: () => statsApi.getUserStats(),
    select: (data) => data.data,
  });
}
