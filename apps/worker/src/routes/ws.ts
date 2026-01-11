// edgeroom/apps/worker/src/routes/ws.ts
import { Hono } from "hono";
import type { Bindings } from "../types";

export const wsRoutes = new Hono<{ Bindings: Bindings }>();

wsRoutes.get("/rooms/:id/ws", async (c) => {
  const roomId = c.req.param("id");
  const id = c.env.ROOM_DO.idFromName(roomId);
  const stub = c.env.ROOM_DO.get(id);
  return stub.fetch(c.req.raw);
});
