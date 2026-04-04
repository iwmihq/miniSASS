import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/api-client";

export function useSites(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["sites", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/monitor/sites/", {
        params: filters,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSiteDetails(siteId?: string | number) {
  return useQuery({
    queryKey: ["sites", siteId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/monitor/sites/${siteId}/`);
      return data;
    },
    enabled: !!siteId,
  });
}
