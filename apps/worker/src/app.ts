// edgeroom/apps/worker/src/app.ts
import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Bindings } from "./types";
import { applyErrorHandling } from "./middleware/error";
import { healthRoutes } from "./routes/health";
import { wsRoutes } from "./routes/ws";
import { roomsRoutes } from "./routes/rooms/index";
import { incidentsRoutes } from "./routes/incidents";

const app = new Hono<{ Bindings: Bindings }>();

applyErrorHandling(app);

app.use("/api/*", cors({
  origin: (origin) => {
    if (!origin) return "";
    try {
      const { hostname, protocol } = new URL(origin);
      if (protocol === "https:" && hostname.endsWith("edgeroom.pages.dev")) {
        return origin;
      }
    } catch {}
    return "";
  },
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));


// Small, focused routers
app.route("/api", healthRoutes);
app.route("/api", wsRoutes);

// Domain routers (your existing ones)
app.route("/api/rooms", roomsRoutes);
app.route("/api/incidents", incidentsRoutes);

export default app;
