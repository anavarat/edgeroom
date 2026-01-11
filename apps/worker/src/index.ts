// edgeroom/apps/worker/src/index.ts

import { Hono } from "hono";
import { DurableObject } from "cloudflare:workers";

import type { Bindings } from "./types";
import { roomsRoutes } from "./routes/rooms";

const app = new Hono<{ Bindings: Bindings }>();

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export class RoomDurableObject extends DurableObject<Bindings> {
  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
  }
}

// HealthCheck Endpoints
app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/db-ping", async (c) => {
  const result = await c.env.DB.prepare("SELECT 1 as one").first();
  return c.json({ ok: true, db: result });
});


// Mount Routers
app.route("/api/rooms", roomsRoutes);

export default app;
