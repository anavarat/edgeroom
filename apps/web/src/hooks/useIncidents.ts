// edgeroom/apps/web/src/hooks/useIncidents.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import type { IncidentCreateInput } from "@edgeroom/shared";
import { createIncident, listIncidents } from "../api/incidents";

export function useIncidents(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => listIncidents(params),
  });
}

export function useCreateIncident() {
  return useMutation({
    mutationFn: (input: IncidentCreateInput) => createIncident(input),
  });
}
