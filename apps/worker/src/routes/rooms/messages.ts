// edgeroom/apps/worker/src/routes/rooms/messages.ts
import { Hono } from "hono";
import type { Bindings } from "../../types";
import { listMessagesHandler, createMessageHandler } from "../../handlers/rooms";

type App = { Bindings: Bindings };
export const messagesRoutes = new Hono<App>();

messagesRoutes.get("/messages", listMessagesHandler);
messagesRoutes.post("/messages", createMessageHandler);
