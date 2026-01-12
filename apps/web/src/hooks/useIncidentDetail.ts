import { useQuery } from "@tanstack/react-query";
import { getIncidentDetail } from "../api/incidents";

export function useIncidentDetail(incidentKey: string | undefined) {
  return useQuery({
    queryKey: ["incident", incidentKey],
    enabled: Boolean(incidentKey),
    queryFn: () => {
      if (!incidentKey) {
        return Promise.reject(new Error("Incident key required"));
      }
      return getIncidentDetail(incidentKey);
    },
  });
}
