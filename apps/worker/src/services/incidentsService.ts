// edgeroom/apps/worker/src/services/incidentsService.ts

import type { Bindings } from "../types";
import type {
  IncidentTriggerInput,
  Room,
  RoomEvent,
  Task,
} from "@edgeroom/shared";

import { createRoom, getRoomById } from "./roomsService";
import { createEvent, listEvents } from "./eventsService";
import { listTasks } from "./tasksService";

function nowIso(): string {
  return new Date().toISOString();
}

export type IncidentTriggerResult =
  | { created: true; roomId: string; event: RoomEvent }
  | { created: false; roomId: string; event?: RoomEvent };

export async function triggerIncident(
  env: Bindings,
  input: IncidentTriggerInput
): Promise<IncidentTriggerResult> {
  const existing = await env.DB.prepare(
    `SELECT room_id as roomId
     FROM incident_rooms
     WHERE incident_key = ?`
  )
    .bind(input.incidentKey)
    .first<{ roomId: string }>();

  if (existing?.roomId) {
    return { created: false, roomId: existing.roomId };
  }

  const room = await createRoom(env, input.roomName.trim());
  const event = await createEvent(env, room.id, input.initialEvent);

  try {
    await env.DB.prepare(
      `INSERT INTO incident_rooms (incident_key, room_id, created_at)
       VALUES (?, ?, ?)`
    )
      .bind(input.incidentKey, room.id, nowIso())
      .run();

    return { created: true, roomId: room.id, event };
  } catch (e) {
    const again = await env.DB.prepare(
      `SELECT room_id as roomId
       FROM incident_rooms
       WHERE incident_key = ?`
    )
      .bind(input.incidentKey)
      .first<{ roomId: string }>();

    if (again?.roomId) return { created: false, roomId: again.roomId };
    throw e;
  }
}

export async function getRoomIdForIncident(
  env: Bindings,
  incidentKey: string
): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT room_id as roomId
     FROM incident_rooms
     WHERE incident_key = ?`
  )
    .bind(incidentKey)
    .first<{ roomId: string }>();

  return row?.roomId ?? null;
}

/** Dashboard list item */
export type IncidentListItem = {
  incidentKey: string;
  incidentCreatedAt: string; // from incident_rooms.created_at
  room: Room;
};

/** GET /api/incidents */
export async function listIncidents(
  env: Bindings,
  limit = 50,
  offset = 0
): Promise<IncidentListItem[]> {
  const res = await env.DB.prepare(
    `SELECT
       ir.incident_key as incidentKey,
       ir.created_at as incidentCreatedAt,
       r.id as roomId,
       r.name as roomName,
       r.created_at as roomCreatedAt
     FROM incident_rooms ir
     JOIN rooms r ON r.id = ir.room_id
     ORDER BY ir.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  const rows = (res.results ?? []) as any[];

  return rows.map((r) => ({
    incidentKey: r.incidentKey,
    incidentCreatedAt: r.incidentCreatedAt,
    room: {
      id: r.roomId,
      name: r.roomName,
      createdAt: r.roomCreatedAt,
    },
  }));
}

/** Detail response */
export type IncidentDetail = {
  incidentKey: string;
  incidentCreatedAt: string;
  room: Room;
  events: RoomEvent[];
  tasks: Task[];
};

/** GET /api/incidents/:incidentKey */
export async function getIncidentByKey(
  env: Bindings,
  incidentKey: string
): Promise<IncidentDetail | null> {
  const mapping = await env.DB.prepare(
    `SELECT
       incident_key as incidentKey,
       room_id as roomId,
       created_at as incidentCreatedAt
     FROM incident_rooms
     WHERE incident_key = ?`
  )
    .bind(incidentKey)
    .first<{ incidentKey: string; roomId: string; incidentCreatedAt: string }>();

  if (!mapping?.roomId) return null;

  const room = await getRoomById(env, mapping.roomId);
  if (!room) return null;

  const [events, tasks] = await Promise.all([
    listEvents(env, room.id, 200),
    listTasks(env, room.id, 200),
  ]);

  return {
    incidentKey: mapping.incidentKey,
    incidentCreatedAt: mapping.incidentCreatedAt,
    room,
    events,
    tasks,
  };
}
