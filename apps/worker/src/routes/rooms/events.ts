// edgeroom/apps/worker/src/routes/rooms/events.ts
import { Hono } from "hono";
import type { Bindings } from "../../types";
import { listEventsHandler, createEventHandler } from "../../handlers/rooms";

type App = { Bindings: Bindings };
export const eventsRoutes = new Hono<App>();

eventsRoutes.get("/events", listEventsHandler);
eventsRoutes.post("/events", createEventHandler);
