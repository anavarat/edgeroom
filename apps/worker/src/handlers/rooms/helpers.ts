// edgeroom/apps/worker/src/handlers/rooms/helpers.ts
import type { Context } from "hono";
import type { Bindings } from "../../types";
import { errorResponse } from "../../utils/http";
import { getRoomById } from "../../services/roomsService";

export type App = { Bindings: Bindings };
export type Ctx = Context<App>;

export async function requireRoom(c: Ctx, roomId: string) {
  const room = await getRoomById(c.env, roomId);
  if (!room) {
    return {
      ok: false as const,
      res: errorResponse(c, 404, "NOT_FOUND", "Room not found"),
    };
  }
  return { ok: true as const, room };
}

export async function parseJsonBody(c: Ctx) {
  return c.req.json().catch(() => null);
}
