// edgeroom/apps/worker/src/routes/health.ts
import { Hono } from "hono";
import type { Bindings } from "../types";

export const healthRoutes = new Hono<{ Bindings: Bindings }>();

healthRoutes.get("/health", (c) => c.json({ ok: true }));

healthRoutes.get("/db-ping", async (c) => {
  const result = await c.env.DB.prepare("SELECT 1 as one").first();
  return c.json({ ok: true, db: result });
});
