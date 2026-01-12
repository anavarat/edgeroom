import type { IncidentCreateInput, IncidentTriggerInput, Room, RoomEvent } from "@edgeroom/shared";
import { requestJson } from "./client";

export type IncidentListItem = {
  incidentKey: string;
  incidentCreatedAt: string;
  room: Room;
};

export type IncidentListResponse = {
  incidents: IncidentListItem[];
  limit: number;
  offset: number;
};

export type CreateIncidentResponse = {
  created: boolean;
  incidentKey: string;
  room: Room;
  event?: RoomEvent;
};

export type IncidentDetailResponse = {
  incidentKey: string;
  incidentCreatedAt: string;
  room: Room;
  events: RoomEvent[];
  tasks: import("@edgeroom/shared").Task[];
};

export type TriggerIncidentResponse =
  | { created: true; incidentKey: string; room: Room; event?: RoomEvent }
  | { created: false; incidentKey: string; room: Room };

export async function listIncidents(params?: { limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return requestJson<IncidentListResponse>(`/api/incidents${suffix}`);
}

export async function getIncidentDetail(incidentKey: string) {
  return requestJson<IncidentDetailResponse>(`/api/incidents/${incidentKey}`);
}

export async function triggerIncident(input: IncidentTriggerInput) {
  return requestJson<TriggerIncidentResponse>("/api/incidents/trigger", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createIncident(input: IncidentCreateInput) {
  return requestJson<CreateIncidentResponse>("/api/incidents/create", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
