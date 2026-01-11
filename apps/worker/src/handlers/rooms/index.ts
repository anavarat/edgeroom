// edgeroom/apps/worker/src/handlers/rooms/index.ts
import { CreateRoomSchema } from "@edgeroom/shared";
import { errorResponse, zodIssues } from "../../utils/http";
import { createRoom, getRoomById, listRooms } from "../../services/roomsService";
import type { Ctx } from "./helpers";
import { parseJsonBody } from "./helpers";

/**
 * GET /api/rooms
 * List rooms (most recent first).
 */
export async function listRoomsHandler(c: Ctx) {
  const rooms = await listRooms(c.env);
  return c.json({ rooms });
}

/**
 * POST /api/rooms
 * Create a new room by name.
 */
export async function createRoomHandler(c: Ctx) {
  const body = await parseJsonBody(c);
  const parsed = CreateRoomSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const room = await createRoom(c.env, parsed.data.name.trim());
  return c.json(room, 201);
}

/**
 * GET /api/rooms/:id
 * Fetch room details by id.
 */
export async function getRoomHandler(c: Ctx) {
  const roomId = c.req.param("id");
  const room = await getRoomById(c.env, roomId);
  if (!room) return errorResponse(c, 404, "NOT_FOUND", "Room not found");
  return c.json(room);
}
