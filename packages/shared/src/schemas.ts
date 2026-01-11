import { z } from "zod";

export const PresenceSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1).max(60),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(1).max(80),
});

export const CreateEventSchema = z.object({
  type: z.enum(["note", "status", "link"]),
  message: z.string().min(1).max(2000),
  createdBy: PresenceSchema,
});

export const IncidentTriggerSchema = z.object({
  incidentKey: z.string().min(1).max(120),  
  roomName: z.string().min(1).max(80),
  initialEvent: CreateEventSchema,          
});

export const IncidentCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000).optional(),
  createdBy: PresenceSchema, // human
});


export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  assignee: z.string().min(1).max(60).optional(),
  createdBy: PresenceSchema,
});

export const UpdateTaskSchema = z.object({
  status: z.enum(["open", "done"]).optional(),
  title: z.string().min(1).max(200).optional(),
  assignee: z.string().min(1).max(60).nullable().optional(),
});

export const CreateChatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  createdBy: PresenceSchema,
});

export const WsHelloSchema = z.object({
  kind: z.literal("hello"),
  user: PresenceSchema,
});
