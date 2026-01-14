import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getIncidentDetail, updateIncident } from "../api/incidents";
import type { IncidentUpdateInput } from "@edgeroom/shared";

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

export function useUpdateIncident(incidentKey: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IncidentUpdateInput) => {
      if (!incidentKey) {
        return Promise.reject(new Error("Incident key required"));
      }
      return updateIncident(incidentKey, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentKey] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
