import { useQuery } from "@tanstack/react-query";
import { sessionApi } from "@/services/api/modules/session";

export function useTodaySession() {
  const localHour = new Date().getHours();
  return useQuery({
    queryKey: ["session", "today"],
    queryFn: () => sessionApi.getTodaySession(localHour),
    select: (data) => data.data,
  });
}
