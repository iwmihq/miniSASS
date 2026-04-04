import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/api-client";

interface Observation {
  observation: string;
  username: string;
  site: string;
  score: number;
  river_category: string;
  organisation: string;
  time_stamp: string;
  [key: string]: unknown;
}

export function useRecentObservations() {
  return useQuery({
    queryKey: ["observations", "recent"],
    queryFn: async () => {
      const { data } = await apiClient.get<Observation[]>(
        "/monitor/observations/recent-observations/"
      );
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useObservations(siteId?: string) {
  return useQuery({
    queryKey: ["observations", siteId],
    queryFn: async () => {
      const url = siteId
        ? `/monitor/observations/?site=${siteId}`
        : "/monitor/observations/";
      const { data } = await apiClient.get(url);
      return data;
    },
    enabled: !!siteId,
  });
}
