// edgeroom/packages/shared/src/types.ts
import { z } from "zod";
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
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type IncidentTriggerInput = z.infer<typeof IncidentTriggerSchema>;
export type IncidentCreateInput = z.infer<typeof IncidentCreateSchema>;
export type CreateChatMessageInput = z.infer<typeof CreateChatMessageSchema>;
export type WsClientHello = z.infer<typeof WsHelloSchema>;

// Domain types (not user-input) can stay as normal TS types:
export type Room = { id: string; name: string; createdAt: string };
export type RoomEvent = {
  id: string;
  roomId: string;
  type: "note" | "status" | "link";
  message: string;
  createdAt: string;
  author: Presence;
};
export type Task = {
  id: string;
  roomId: string;
  title: string;
  status: "open" | "done";
  createdAt: string;
  updatedAt: string;
  assignee?: string;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  message: string;
  createdAt: string;
  author: Presence;
};

// export type WsServerMessage =
//   | { kind: "presence"; users: Presence[] }
//   | { kind: "event:created"; event: RoomEvent }
//   | { kind: "task:created"; task: Task }
//   | { kind: "task:updated"; task: Task }
//   | { kind: "chat:message"; message: ChatMessage }
//   | { kind: "error"; message: string };


  




