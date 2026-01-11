// edgeroom/apps/worker/src/routes/rooms/state.ts
import { Hono } from "hono";
import type { Bindings } from "../../types";
import { getRoomStateHandler } from "../../handlers/rooms";

type App = { Bindings: Bindings };
export const stateRoutes = new Hono<App>();

stateRoutes.get("/state", getRoomStateHandler);
