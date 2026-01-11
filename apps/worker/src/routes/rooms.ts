// // edgeroom/apps/worker/src/routes/rooms.ts

// import { Hono } from "hono";

// import {
//   CreateRoomSchema,
//   CreateEventSchema,
//   CreateTaskSchema,
//   UpdateTaskSchema,
//   CreateChatMessageSchema,
// } from "@edgeroom/shared";
// import type { WsServerMessage  } from "@edgeroom/shared";

// import type { Bindings } from "../types";
// import { errorResponse, zodIssues } from "../utils/http";
// import { createRoom, getRoomById, listRooms } from "../services/roomsService";
// import { createEvent, listEvents } from "../services/eventsService";
// import { createTask, listTasks, updateTask } from "../services/tasksService";
// import { createMessage, listMessages } from "../services/messagesService";


// type App = { Bindings: Bindings };

// export const roomsRoutes = new Hono<App>();

// async function broadcastToRoom(env: Bindings, roomId: string, msg: WsServerMessage) {
//   try {
//     const id = env.ROOM_DO.idFromName(roomId);
//     const stub = env.ROOM_DO.get(id);

//     await stub.fetch("https://room-do/broadcast", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify(msg),
//     });
//   } catch (e) {
//     // Don’t fail the API call if WS broadcast fails — DB write is the source of truth.
//     console.warn("Broadcast failed:", e);
//   }
// }

// // ---- Rooms ----
// roomsRoutes.get("/", async (c) => {
//   const rooms = await listRooms(c.env);
//   return c.json({ rooms });
// });

// roomsRoutes.post("/", async (c) => {
//   const body = await c.req.json().catch(() => null);
//   const parsed = CreateRoomSchema.safeParse(body);

//   if (!parsed.success) {
//     return errorResponse(
//       c,
//       400,
//       "VALIDATION_ERROR",
//       "Validation failed",
//       zodIssues(parsed.error)
//     );
//   }

//   const room = await createRoom(c.env, parsed.data.name.trim());
//   return c.json(room, 201);
// });

// roomsRoutes.get("/:id", async (c) => {
//   const roomId = c.req.param("id");
//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");
//   return c.json(room);
// });

// // ---- Room State (single-shot hydrate) ----
// roomsRoutes.get("/:id/state", async (c) => {
//   const roomId = c.req.param("id");

//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   // Optional query params
//   const eventsLimitRaw = c.req.query("eventsLimit");
//   const tasksLimitRaw = c.req.query("tasksLimit");

//   const eventsLimit = eventsLimitRaw ? Number(eventsLimitRaw) : 200;
//   const tasksLimit = tasksLimitRaw ? Number(tasksLimitRaw) : 200;

//   const safeEventsLimit = Number.isFinite(eventsLimit)
//     ? Math.min(Math.max(eventsLimit, 1), 500)
//     : 200;

//   const safeTasksLimit = Number.isFinite(tasksLimit)
//     ? Math.min(Math.max(tasksLimit, 1), 500)
//     : 200;

//   const messagesLimitRaw = c.req.query("messagesLimit");
//   const messagesLimit = messagesLimitRaw ? Number(messagesLimitRaw) : 200;

//   const safeMessagesLimit = Number.isFinite(messagesLimit)
//     ? Math.min(Math.max(messagesLimit, 1), 500)
//     : 200;

//   const [events, tasks, messages] = await Promise.all([
//     listEvents(c.env, roomId, safeEventsLimit),
//     listTasks(c.env, roomId, safeTasksLimit),
//     listMessages(c.env, roomId, safeMessagesLimit),
//   ]);

//   return c.json({ room, events, tasks, messages });

// });

// // DEV-only: forward raw payload to DO /broadcast for curl testing
// roomsRoutes.post("/:id/broadcast", async (c) => {
//   const roomId = c.req.param("id");
//   const body = await c.req.json().catch(() => null);

//   const id = c.env.ROOM_DO.idFromName(roomId);
//   const stub = c.env.ROOM_DO.get(id);

//   const res = await stub.fetch("https://room-do/broadcast", {
//     method: "POST",
//     headers: { "content-type": "application/json" },
//     body: JSON.stringify(body),
//   });

//   const text = await res.text();
//   return new Response(text || null, {
//     status: res.status,
//     headers: { "content-type": res.headers.get("content-type") ?? "text/plain" },
//   });
// });

// // ---- Events ----

// roomsRoutes.get("/:id/events", async (c) => {
//   const roomId = c.req.param("id");
//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   const events = await listEvents(c.env, roomId);
//   return c.json({ events });
// });

// roomsRoutes.post("/:id/events", async (c) => {
//   const roomId = c.req.param("id");
//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   const body = await c.req.json().catch(() => null);
//   const parsed = CreateEventSchema.safeParse(body);

//   if (!parsed.success) {
//     return errorResponse(
//       c,
//       400,
//       "VALIDATION_ERROR",
//       "Validation failed",
//       zodIssues(parsed.error)
//     );
//   }

//   const event = await createEvent(c.env, roomId, parsed.data);

//   await broadcastToRoom(c.env, roomId, { kind: "event:created", event });

//   return c.json(event, 201);
// });

// // ---- Tasks ----

// roomsRoutes.get("/:id/tasks", async (c) => {
//   const roomId = c.req.param("id");
//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   const tasks = await listTasks(c.env, roomId);
//   return c.json({ tasks });
// });

// roomsRoutes.post("/:id/tasks", async (c) => {
//   const roomId = c.req.param("id");
//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   const body = await c.req.json().catch(() => null);
//   const parsed = CreateTaskSchema.safeParse(body);

//   if (!parsed.success) {
//     return errorResponse(
//       c,
//       400,
//       "VALIDATION_ERROR",
//       "Validation failed",
//       zodIssues(parsed.error)
//     );
//   }

//   const task = await createTask(c.env, roomId, parsed.data);

//   await broadcastToRoom(c.env, roomId, { kind: "task:created", task });

//   return c.json(task, 201);
// });

// roomsRoutes.patch("/:id/tasks/:taskId", async (c) => {
//   const roomId = c.req.param("id");
//   const taskId = c.req.param("taskId");

//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   const body = await c.req.json().catch(() => null);
//   const parsed = UpdateTaskSchema.safeParse(body);

//   if (!parsed.success) {
//     return errorResponse(
//       c,
//       400,
//       "VALIDATION_ERROR",
//       "Validation failed",
//       zodIssues(parsed.error)
//     );
//   }

//   const updated = await updateTask(c.env, roomId, taskId, parsed.data);
//   if (!updated) return errorResponse(c, 404, "NOT_FOUND", "Task not found");

//   await broadcastToRoom(c.env, roomId, { kind: "task:updated", task: updated });

//   return c.json(updated);
// });

// // ---- Messages (chat) ----

// roomsRoutes.get("/:id/messages", async (c) => {
//   const roomId = c.req.param("id");
//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   const limitRaw = c.req.query("limit");
//   const limit = limitRaw ? Number(limitRaw) : 200;
//   const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 200;

//   const messages = await listMessages(c.env, roomId, safeLimit);
//   return c.json({ messages });
// });

// roomsRoutes.post("/:id/messages", async (c) => {
//   const roomId = c.req.param("id");
//   const room = await getRoomById(c.env, roomId);
//   if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");

//   const body = await c.req.json().catch(() => null);
//   const parsed = CreateChatMessageSchema.safeParse(body);

//   if (!parsed.success) {
//     return errorResponse(
//       c,
//       400,
//       "VALIDATION_ERROR",
//       "Validation failed",
//       zodIssues(parsed.error)
//     );
//   }

//   const msg = await createMessage(c.env, roomId, parsed.data);

//   // ✅ broadcast to WS listeners in room
//   await broadcastToRoom(c.env, roomId, { kind: "chat:message", message: msg });

//   return c.json(msg, 201);
// });

