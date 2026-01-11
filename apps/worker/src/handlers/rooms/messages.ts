// edgeroom/apps/worker/src/handlers/rooms/messages.ts
import { CreateChatMessageSchema } from "@edgeroom/shared";
import { errorResponse, zodIssues } from "../../utils/http";
import { parseLimit } from "../../utils/request";
import { broadcastToRoom } from "../../utils/roomDo";
import { createMessage, listMessages } from "../../services/messagesService";
import type { Ctx } from "./helpers";
import { requireRoom, parseJsonBody } from "./helpers";

/**
 * GET /api/rooms/:id/messages
 * List chat messages for a room.
 */
export async function listMessagesHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const safeLimit = parseLimit(c.req.query("limit"), 200);
  const messages = await listMessages(c.env, roomId, safeLimit);

  return c.json({ messages });
}

/**
 * POST /api/rooms/:id/messages
 * Create a chat message and broadcast it.
 */
export async function createMessageHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await parseJsonBody(c);
  const parsed = CreateChatMessageSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const msg = await createMessage(c.env, roomId, parsed.data);
  await broadcastToRoom(c.env, roomId, { kind: "chat:message", message: msg });

  return c.json(msg, 201);
}
