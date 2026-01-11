// edgeroom/apps/worker/src/services/messagesService.ts

import type { Bindings } from "../types";
import type { ChatMessage, CreateChatMessageInput, Presence } from "@edgeroom/shared";

function nowIso(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

function toPresence(userId: unknown, displayName: unknown): Presence {
  const u = typeof userId === "string" && userId.length > 0 ? userId : "unknown";
  const d = typeof displayName === "string" && displayName.length > 0 ? displayName : "Unknown";
  return { userId: u, displayName: d };
}

export async function createMessage(
  env: Bindings,
  roomId: string,
  input: CreateChatMessageInput
): Promise<ChatMessage> {
  const messageId = id();
  const createdAt = nowIso();

  await env.DB.prepare(
    `INSERT INTO messages
      (id, room_id, message, created_at, author_user_id, author_display_name)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      messageId,
      roomId,
      input.message,
      createdAt,
      input.createdBy.userId,
      input.createdBy.displayName
    )
    .run();

  return {
    id: messageId,
    roomId,
    message: input.message,
    createdAt,
    author: input.createdBy,
  };
}

export async function listMessages(
  env: Bindings,
  roomId: string,
  limit = 200
): Promise<ChatMessage[]> {
  const res = await env.DB.prepare(
    `SELECT
       id,
       room_id as roomId,
       message,
       created_at as createdAt,
       author_user_id as authorUserId,
       author_display_name as authorDisplayName
     FROM messages
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
    message: r.message,
    createdAt: r.createdAt,
    author: toPresence(r.authorUserId, r.authorDisplayName),
  }));
}
