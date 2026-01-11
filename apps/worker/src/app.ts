// edgeroom/apps/worker/src/app.ts
import { Hono } from "hono";
import type { Bindings } from "./types";

import { applyErrorHandling } from "./middleware/error";
import { healthRoutes } from "./routes/health";
import { wsRoutes } from "./routes/ws";

import { roomsRoutes } from "./routes/rooms";
import { incidentsRoutes } from "./routes/incidents";

const app = new Hono<{ Bindings: Bindings }>();

applyErrorHandling(app);

// Small, focused routers
app.route("/api", healthRoutes);
app.route("/api", wsRoutes);

// Domain routers (your existing ones)
app.route("/api/rooms", roomsRoutes);
app.route("/api/incidents", incidentsRoutes);

export default app;
