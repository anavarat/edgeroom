// edgeroom/apps/worker/src/handlers/rooms.ts
import type { Context } from "hono";
import type { Bindings } from "../types";
import {
  CreateRoomSchema,
  CreateEventSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateChatMessageSchema,
} from "@edgeroom/shared";

import { errorResponse, zodIssues } from "../utils/http";
import { parseLimit } from "../utils/request";
import { broadcastToRoom } from "../utils/roomDo";

import { createRoom, getRoomById, listRooms } from "../services/roomsService";
import { createEvent, listEvents } from "../services/eventsService";
import { createTask, listTasks, updateTask } from "../services/tasksService";
import { createMessage, listMessages } from "../services/messagesService";

type App = { Bindings: Bindings };
type Ctx = Context<App>;

async function requireRoom(c: Ctx, roomId: string) {
  const room = await getRoomById(c.env, roomId);
  if (!room) return { ok: false as const, res: errorResponse(c, 404, "NOT_FOUND", "Room not found") };
  return { ok: true as const, room };
}

// ---- Rooms ----
export async function listRoomsHandler(c: Ctx) {
  const rooms = await listRooms(c.env);
  return c.json({ rooms });
}

export async function createRoomHandler(c: Ctx) {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateRoomSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const room = await createRoom(c.env, parsed.data.name.trim());
  return c.json(room, 201);
}

export async function getRoomHandler(c: Ctx) {
  const roomId = c.req.param("id");
  const room = await getRoomById(c.env, roomId);
  if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");
  return c.json(room);
}

// ---- Room State ----
export async function getRoomStateHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const safeEventsLimit = parseLimit(c.req.query("eventsLimit"), 200);
  const safeTasksLimit = parseLimit(c.req.query("tasksLimit"), 200);
  const safeMessagesLimit = parseLimit(c.req.query("messagesLimit"), 200);

  const [events, tasks, messages] = await Promise.all([
    listEvents(c.env, roomId, safeEventsLimit),
    listTasks(c.env, roomId, safeTasksLimit),
    listMessages(c.env, roomId, safeMessagesLimit),
  ]);

  return c.json({ room: r.room, events, tasks, messages });
}

// ---- DEV broadcast proxy ----
export async function devBroadcastProxyHandler(c: Ctx) {
  const roomId = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const id = c.env.ROOM_DO.idFromName(roomId);
  const stub = c.env.ROOM_DO.get(id);

  const res = await stub.fetch("https://room-do/broadcast", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text || null, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "text/plain" },
  });
}

// ---- Events ----
export async function listEventsHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const events = await listEvents(c.env, roomId);
  return c.json({ events });
}

export async function createEventHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await c.req.json().catch(() => null);
  const parsed = CreateEventSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const event = await createEvent(c.env, roomId, parsed.data);
  await broadcastToRoom(c.env, roomId, { kind: "event:created", event });

  return c.json(event, 201);
}

// ---- Tasks ----
export async function listTasksHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const tasks = await listTasks(c.env, roomId);
  return c.json({ tasks });
}

export async function createTaskHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await c.req.json().catch(() => null);
  const parsed = CreateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const task = await createTask(c.env, roomId, parsed.data);
  await broadcastToRoom(c.env, roomId, { kind: "task:created", task });

  return c.json(task, 201);
}

export async function updateTaskHandler(c: Ctx) {
  const roomId = c.req.param("id");
  const taskId = c.req.param("taskId");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const updated = await updateTask(c.env, roomId, taskId, parsed.data);
  if (!updated) return errorResponse(c, 404, "NOT_FOUND", "Task not found");

  await broadcastToRoom(c.env, roomId, { kind: "task:updated", task: updated });

  return c.json(updated);
}

// ---- Messages ----
export async function listMessagesHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const safeLimit = parseLimit(c.req.query("limit"), 200);
  const messages = await listMessages(c.env, roomId, safeLimit);

  return c.json({ messages });
}

export async function createMessageHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await c.req.json().catch(() => null);
  const parsed = CreateChatMessageSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const msg = await createMessage(c.env, roomId, parsed.data);
  await broadcastToRoom(c.env, roomId, { kind: "chat:message", message: msg });

  return c.json(msg, 201);
}
