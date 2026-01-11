// edgeroom/apps/worker/src/routes/rooms/index.ts
import { Hono } from "hono";
import type { Bindings } from "../../types";

import {
  listRoomsHandler,
  createRoomHandler,
  getRoomHandler,
} from "../../handlers/rooms";

import { stateRoutes } from "./state";
import { eventsRoutes } from "./events";
import { tasksRoutes } from "./tasks";
import { messagesRoutes } from "./messages";
import { devRoutes } from "./dev";

type App = { Bindings: Bindings };
export const roomsRoutes = new Hono<App>();

// Rooms root
roomsRoutes.get("/", listRoomsHandler);
roomsRoutes.post("/", createRoomHandler);
roomsRoutes.get("/:id", getRoomHandler);

// Sub-resources
roomsRoutes.route("/:id", stateRoutes);
roomsRoutes.route("/:id", eventsRoutes);
roomsRoutes.route("/:id", tasksRoutes);
roomsRoutes.route("/:id", messagesRoutes);

// Dev-only (mount conditionally if you want; see dev.ts)
roomsRoutes.route("/:id", devRoutes);
