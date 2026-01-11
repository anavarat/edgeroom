import { Hono } from "hono";
import type { Bindings } from "../types";

import {
  listIncidentsHandler,
  getIncidentDetailHandler,
  triggerIncidentHandler,
  createIncidentHandler,
} from "../handlers/incidents";

type App = { Bindings: Bindings };
export const incidentsRoutes = new Hono<App>();

incidentsRoutes.get("/", listIncidentsHandler);
incidentsRoutes.get("/:incidentKey", getIncidentDetailHandler);
incidentsRoutes.post("/trigger", triggerIncidentHandler);
incidentsRoutes.post("/create", createIncidentHandler);
