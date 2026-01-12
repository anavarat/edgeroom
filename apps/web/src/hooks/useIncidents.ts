// edgeroom/apps/web/src/hooks/useIncidents.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IncidentCreateInput } from "@edgeroom/shared";
import { createIncident, listIncidents, triggerIncident } from "../api/incidents";
import type { IncidentTriggerInput } from "@edgeroom/shared";

export function useIncidents(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => listIncidents(params),
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IncidentCreateInput) => createIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

export function useTriggerIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IncidentTriggerInput) => triggerIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
