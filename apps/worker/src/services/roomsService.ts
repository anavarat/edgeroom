// edgeroom/apps/worker/src/services/roomService.ts

import type { Bindings } from "../types";

function nowIso(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

export type RoomRow = {
  id: string;
  name: string;
  createdAt: string;
};

export async function createRoom(env: Bindings, name: string): Promise<RoomRow> {
  const roomId = id();
  const createdAt = nowIso();

  await env.DB.prepare(
    "INSERT INTO rooms (id, name, created_at) VALUES (?, ?, ?)"
  )
    .bind(roomId, name, createdAt)
    .run();

  return { id: roomId, name, createdAt };
}

export async function listRooms(env: Bindings): Promise<RoomRow[]> {
  const res = await env.DB.prepare(
    "SELECT id, name, created_at as createdAt FROM rooms ORDER BY created_at DESC LIMIT 50"
  ).all();

  return (res.results ?? []) as RoomRow[];
}

export async function getRoomById(env: Bindings, roomId: string): Promise<RoomRow | null> {
  const row = await env.DB.prepare(
    "SELECT id, name, created_at as createdAt FROM rooms WHERE id = ?"
  )
    .bind(roomId)
    .first();

  return (row as RoomRow) ?? null;
}