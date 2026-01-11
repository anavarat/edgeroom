// edgeroom/apps/worker/src/routes/rooms.ts

import { Hono } from "hono";

import type { Bindings } from "../types";
import {
  CreateRoomSchema,
  CreateEventSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
} from "@edgeroom/shared";
import { createRoom, getRoomById, listRooms } from "../services/roomsService";
import { createEvent, listEvents } from "../services/eventsService";
import { createTask, listTasks, updateTask } from "../services/tasksService";

type App = { Bindings: Bindings };

export const roomsRoutes = new Hono<App>();

// ---- Rooms ----
roomsRoutes.get("/", async (c) => {
  const rooms = await listRooms(c.env);
  return c.json({ rooms });
});

roomsRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateRoomSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400
    );
  }

  const room = await createRoom(c.env, parsed.data.name.trim());
  return c.json(room, 201);
});

roomsRoutes.get("/:id", async (c) => {
  const roomId = c.req.param("id");
  const room = await getRoomById(c.env, roomId);
  if (!room) return c.json({ error: "Room not found" }, 404);
  return c.json(room);
});

// ---- Events ----

roomsRoutes.get("/:id/events", async (c) => {
  const roomId = c.req.param("id");
  const room = await getRoomById(c.env, roomId);
  if (!room) return c.json({ error: "Room not found" }, 404);

  const events = await listEvents(c.env, roomId);
  return c.json({ events });
});

roomsRoutes.post("/:id/events", async (c) => {
  const roomId = c.req.param("id");
  const room = await getRoomById(c.env, roomId);
  if (!room) return c.json({ error: "Room not found" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = CreateEventSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400
    );
  }

  const event = await createEvent(c.env, roomId, parsed.data);
  return c.json(event, 201);
});

// ---- Tasks ----

roomsRoutes.get("/:id/tasks", async (c) => {
  const roomId = c.req.param("id");
  const room = await getRoomById(c.env, roomId);
  if (!room) return c.json({ error: "Room not found" }, 404);

  const tasks = await listTasks(c.env, roomId);
  return c.json({ tasks });
});

roomsRoutes.post("/:id/tasks", async (c) => {
  const roomId = c.req.param("id");
  const room = await getRoomById(c.env, roomId);
  if (!room) return c.json({ error: "Room not found" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = CreateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400
    );
  }

  const task = await createTask(c.env, roomId, parsed.data);
  return c.json(task, 201);
});

roomsRoutes.patch("/:id/tasks/:taskId", async (c) => {
  const roomId = c.req.param("id");
  const taskId = c.req.param("taskId");

  const room = await getRoomById(c.env, roomId);
  if (!room) return c.json({ error: "Room not found" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400
    );
  }

  const updated = await updateTask(c.env, roomId, taskId, parsed.data);
  if (!updated) return c.json({ error: "Task not found" }, 404);

  return c.json(updated);
});