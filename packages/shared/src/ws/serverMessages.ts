import { z } from "zod";
import { PresenceSchema } from "../schemas";
import { RoomEventSchema, TaskSchema, ChatMessageSchema } from "../domainSchemas";

export const PresenceMsgSchema = z.object({
  kind: z.literal("presence"),
  users: z.array(PresenceSchema),
});

export const EventCreatedMsgSchema = z.object({
  kind: z.literal("event:created"),
  event: RoomEventSchema,
});

export const TaskCreatedMsgSchema = z.object({
  kind: z.literal("task:created"),
  task: TaskSchema,
});

export const TaskUpdatedMsgSchema = z.object({
  kind: z.literal("task:updated"),
  task: TaskSchema,
});

export const ChatMessageMsgSchema = z.object({
  kind: z.literal("chat:message"),
  message: ChatMessageSchema,
});

export const ErrorMsgSchema = z.object({
  kind: z.literal("error"),
  message: z.string().min(1),
});

// Better than union: discriminatedUnion
export const WsServerMessageSchema = z.discriminatedUnion("kind", [
  PresenceMsgSchema,
  EventCreatedMsgSchema,
  TaskCreatedMsgSchema,
  TaskUpdatedMsgSchema,
  ChatMessageMsgSchema,
  ErrorMsgSchema,
]);

export type WsServerMessage = z.infer<typeof WsServerMessageSchema>;
