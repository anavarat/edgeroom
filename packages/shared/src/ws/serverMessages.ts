import { z } from "zod";

/**
 * Server → client messages (runtime schema + inferred types)
 */

export const PresenceMsgSchema = z.object({
  kind: z.literal("presence"),
  users: z.array(
    z.object({
      userId: z.string().min(1),
      displayName: z.string().min(1),
    })
  ),
});

export const EventCreatedMsgSchema = z.object({
  kind: z.literal("event:created"),
  event: z.object({
    id: z.string().min(1),
    roomId: z.string().min(1),
    type: z.enum(["note", "status", "link"]),
    message: z.string(),
    createdAt: z.string().min(1),
    author: z.object({
      userId: z.string().min(1),
      displayName: z.string().min(1),
    }),
  }),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["open", "done"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  assignee: z.string().min(1).optional(),
});

export const TaskCreatedMsgSchema = z.object({
  kind: z.literal("task:created"),
  task: TaskSchema,
});

export const TaskUpdatedMsgSchema = z.object({
  kind: z.literal("task:updated"),
  task: TaskSchema,
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  message: z.string().min(1),
  createdAt: z.string().min(1),
  author: z.object({
    userId: z.string().min(1),
    displayName: z.string().min(1),
  }),
});

export const ChatMessageMsgSchema = z.object({
  kind: z.literal("chat:message"),
  message: ChatMessageSchema,
});

export const ErrorMsgSchema = z.object({
  kind: z.literal("error"),
  message: z.string().min(1),
});

export const WsServerMessageSchema = z.union([
  PresenceMsgSchema,
  EventCreatedMsgSchema,
  TaskCreatedMsgSchema,
  TaskUpdatedMsgSchema,
  ChatMessageMsgSchema,
  ErrorMsgSchema,
]);

export type WsServerMessage = z.infer<typeof WsServerMessageSchema>;
