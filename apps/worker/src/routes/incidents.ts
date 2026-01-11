// edgeroom/apps/worker/src/routes/incidents.ts

import { Hono } from "hono";
import { IncidentTriggerSchema, IncidentCreateSchema } from "@edgeroom/shared";

import type { Bindings } from "../types";
import {
  triggerIncident,
  listIncidents,
  getIncidentByKey,
} from "../services/incidentsService";
import { getRoomById } from "../services/roomsService";

import { errorResponse, zodIssues } from "../utils/http";

type App = { Bindings: Bindings };

export const incidentsRoutes = new Hono<App>();

/**
 * GET /api/incidents
 * Dashboard list (most recent first)
 */
incidentsRoutes.get("/", async (c) => {
  const limit = Number(c.req.query("limit") ?? "50");
  const offset = Number(c.req.query("offset") ?? "0");

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;
  const safeOffset = Number.isFinite(offset) ? Math.max(offset, 0) : 0;

  const incidents = await listIncidents(c.env, safeLimit, safeOffset);
  return c.json({ incidents, limit: safeLimit, offset: safeOffset });
});

/**
 * GET /api/incidents/:incidentKey
 * Detail view for dashboard
 */
incidentsRoutes.get("/:incidentKey", async (c) => {
  const incidentKey = c.req.param("incidentKey");

  const detail = await getIncidentByKey(c.env, incidentKey);
  if (!detail) return errorResponse(c, 404, "NOT_FOUND", "Incident not found");

  return c.json(detail);
});

/**
 * POST /api/incidents/trigger
 * System-driven idempotent trigger.
 */
incidentsRoutes.post("/trigger", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = IncidentTriggerSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      "Validation failed",
      zodIssues(parsed.error)
    );
  }

  const result = await triggerIncident(c.env, parsed.data);

  const room = await getRoomById(c.env, result.roomId);
  if (!room) {
    // This is an internal consistency problem: incident row points to missing room.
    return errorResponse(
      c,
      500,
      "INTERNAL_ERROR",
      "Room not found for incident"
    );
  }

  if (result.created) {
    return c.json(
      {
        created: true,
        incidentKey: parsed.data.incidentKey,
        room,
        event: result.event,
      },
      201
    );
  }

  return c.json(
    {
      created: false,
      incidentKey: parsed.data.incidentKey,
      room,
    },
    200
  );
});

/**
 * POST /api/incidents/create
 * Human-driven creation that mirrors system trigger.
 */
incidentsRoutes.post("/create", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = IncidentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      c,
      400,
      "VALIDATION_ERROR",
      "Validation failed",
      zodIssues(parsed.error)
    );
  }

  const incidentKey = `human:${crypto.randomUUID()}`;

  const triggerInput = {
    incidentKey,
    roomName: parsed.data.title,
    initialEvent: {
      type: "status" as const,
      message: parsed.data.description?.trim().length
        ? parsed.data.description.trim()
        : `Incident created: ${parsed.data.title}`,
      createdBy: parsed.data.createdBy,
    },
  };

  const result = await triggerIncident(c.env, triggerInput);

  const room = await getRoomById(c.env, result.roomId);
  if (!room) {
    return errorResponse(
      c,
      500,
      "INTERNAL_ERROR",
      "Room not found for incident"
    );
  }

  return c.json(
    {
      created: true,
      incidentKey,
      room,
      event: result.created ? result.event : undefined,
    },
    201
  );
});
