import { z } from "zod";
import { PresenceSchema } from "./schemas";

export const RoomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
});

export const RoomEventSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  type: z.enum(["note", "status", "link"]),
  message: z.string(),
  createdAt: z.string().min(1),
  author: PresenceSchema,
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

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  message: z.string().min(1),
  createdAt: z.string().min(1),
  author: PresenceSchema,
});
