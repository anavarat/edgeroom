// edgeroom/apps/worker/src/services/incidentsService.ts

import type { Bindings } from "../types";
import type {
  IncidentTriggerInput,
  IncidentStatus,
  Room,
  RoomEvent,
  Task,
  WsServerMessage
} from "@edgeroom/shared";

import { createRoom, getRoomById } from "./roomsService";
import { createEvent, listEvents } from "./eventsService";
import { listTasks } from "./tasksService";

function nowIso(): string {
  return new Date().toISOString();
}

async function broadcastToRoom(env: Bindings, roomId: string, msg: WsServerMessage) {
  try {
    const id = env.ROOM_DO.idFromName(roomId);
    const stub = env.ROOM_DO.get(id);

    await stub.fetch("https://room-do/broadcast", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(msg),
    });
  } catch (e) {
    console.warn("Incident broadcast failed:", e);
  }
}

export type IncidentTriggerResult =
  | { created: true; roomId: string; event: RoomEvent }
  | { created: false; roomId: string; event?: RoomEvent };

export async function triggerIncident(
  env: Bindings,
  input: IncidentTriggerInput
): Promise<IncidentTriggerResult> {
  // Fast path
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

  // Prepare IDs upfront so we can transact with pure SQL
  const roomId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const createdAt = nowIso();

  const roomName = input.roomName.trim();
  const ev = input.initialEvent;

  try {
    // ✅ Atomic workflow: room + initial event + mapping
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO rooms (id, name, created_at)
         VALUES (?, ?, ?)`
      ).bind(roomId, roomName, createdAt),

      env.DB.prepare(
        `INSERT INTO events
          (id, room_id, type, message, created_at, author_user_id, author_display_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        eventId,
        roomId,
        ev.type,
        ev.message,
        createdAt,
        ev.createdBy.userId,
        ev.createdBy.displayName
      ),

      env.DB.prepare(
        `INSERT INTO incident_rooms (incident_key, room_id, created_at, status)
         VALUES (?, ?, ?, ?)`
      ).bind(input.incidentKey, roomId, createdAt, "open"),
    ]);

    const event: RoomEvent = {
      id: eventId,
      roomId,
      type: ev.type,
      message: ev.message,
      createdAt,
      author: ev.createdBy,
    };

    // ✅ Realtime (non-critical)
    await broadcastToRoom(env, roomId, { kind: "event:created", event });

    return { created: true, roomId, event };
  } catch (e) {
    // Likely race: other request inserted mapping first
    const again = await env.DB.prepare(
      `SELECT room_id as roomId
       FROM incident_rooms
       WHERE incident_key = ?`
    )
      .bind(input.incidentKey)
      .first<{ roomId: string }>();

    if (again?.roomId) {
      return { created: false, roomId: again.roomId };
    }

    // Something else actually failed (e.g., DB issue)
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
  status: IncidentStatus;
  resolvedAt?: string | null;
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
       ir.status as status,
       ir.resolved_at as resolvedAt,
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
    status: (r.status ?? "open") as IncidentStatus,
    resolvedAt: r.resolvedAt,
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
  status: IncidentStatus;
  resolvedAt?: string | null;
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
       created_at as incidentCreatedAt,
       status as status,
       resolved_at as resolvedAt
     FROM incident_rooms
     WHERE incident_key = ?`
  )
    .bind(incidentKey)
    .first<{
      incidentKey: string;
      roomId: string;
      incidentCreatedAt: string;
      status: IncidentStatus;
      resolvedAt?: string | null;
    }>();

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
    status: (mapping.status ?? "open") as IncidentStatus,
    resolvedAt: mapping.resolvedAt ?? null,
    room,
    events,
    tasks,
  };
}

export async function updateIncidentStatus(
  env: Bindings,
  incidentKey: string,
  status: IncidentStatus
): Promise<{ status: IncidentStatus; resolvedAt?: string | null } | null> {
  const resolvedAt = status === "resolved" ? nowIso() : null;

  const res = await env.DB.prepare(
    `UPDATE incident_rooms
     SET status = ?, resolved_at = ?
     WHERE incident_key = ?`
  )
    .bind(status, resolvedAt, incidentKey)
    .run();

  if (res.meta.changes === 0) return null;

  return { status, resolvedAt };
}
