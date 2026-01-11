// edgeroom/apps/worker/src/handlers/rooms/dev.ts
import type { Ctx } from "./helpers";
import { parseJsonBody } from "./helpers";

/**
 * POST /api/rooms/:id/broadcast
 * Dev-only broadcast proxy to the room DO.
 */
export async function devBroadcastProxyHandler(c: Ctx) {
  const roomId = c.req.param("id");
  const body = await parseJsonBody(c);

  const id = c.env.ROOM_DO.idFromName(roomId);
  const stub = c.env.ROOM_DO.get(id);

  const res = await stub.fetch("https://room-do/broadcast", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text || null, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "text/plain" },
  });
}
