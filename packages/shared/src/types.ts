// edgeroom/packages/shared/src/types.ts
import { z } from "zod";

import { RoomSchema, RoomEventSchema, TaskSchema, ChatMessageSchema } from "./domainSchemas";
import {
  PresenceSchema,
  CreateRoomSchema,
  CreateEventSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  IncidentTriggerSchema,
  IncidentCreateSchema,
  WsHelloSchema,
  CreateChatMessageSchema,
} from "./schemas";

export type Presence = z.infer<typeof PresenceSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type RoomEvent = z.infer<typeof RoomEventSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type IncidentTriggerInput = z.infer<typeof IncidentTriggerSchema>;
export type IncidentCreateInput = z.infer<typeof IncidentCreateSchema>;
export type CreateChatMessageInput = z.infer<typeof CreateChatMessageSchema>;
export type WsClientHello = z.infer<typeof WsHelloSchema>;



  








