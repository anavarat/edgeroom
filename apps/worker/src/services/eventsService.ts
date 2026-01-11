// edgeroom/apps/worker/src/services/eventsService.ts

import type { Bindings } from "../types";
import type { CreateEventInput, RoomEvent, Presence } from "@edgeroom/shared";

function nowIso(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

function toPresence(userId: unknown, displayName: unknown): Presence {
  // Since author is mandatory in your domain now, we guarantee a Presence.
  // If DB row is somehow missing, we provide a safe fallback.
  const u = typeof userId === "string" && userId.length > 0 ? userId : "unknown";
  const d =
    typeof displayName === "string" && displayName.length > 0
      ? displayName
      : "Unknown";
  return { userId: u, displayName: d };
}

export async function createEvent(
  env: Bindings,
  roomId: string,
  input: CreateEventInput
): Promise<RoomEvent> {
  const eventId = id();
  const createdAt = nowIso();

  await env.DB.prepare(
    `INSERT INTO events
      (id, room_id, type, message, created_at, author_user_id, author_display_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      eventId,
      roomId,
      input.type,
      input.message,
      createdAt,
      input.createdBy.userId,
      input.createdBy.displayName
    )
    .run();

  return {
    id: eventId,
    roomId,
    type: input.type,
    message: input.message,
    createdAt,
    author: input.createdBy,
  };
}

export async function listEvents(
  env: Bindings,
  roomId: string,
  limit = 200
): Promise<RoomEvent[]> {
  const res = await env.DB.prepare(
    `SELECT
       id,
       room_id as roomId,
       type,
       message,
       created_at as createdAt,
       author_user_id as authorUserId,
       author_display_name as authorDisplayName
     FROM events
     WHERE room_id = ?
     ORDER BY created_at ASC
     LIMIT ?`
  )
    .bind(roomId, limit)
    .all();

  const rows = (res.results ?? []) as any[];

  return rows.map((r) => ({
    id: r.id,
    roomId: r.roomId,
    type: r.type,
    message: r.message,
    createdAt: r.createdAt,
    author: toPresence(r.authorUserId, r.authorDisplayName),
  }));
}
