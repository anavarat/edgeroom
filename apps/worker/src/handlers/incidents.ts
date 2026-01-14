import type { Context } from "hono";
import type { Bindings } from "../types";

import { IncidentTriggerSchema, IncidentCreateSchema, IncidentUpdateSchema } from "@edgeroom/shared";

import { errorResponse, zodIssues } from "../utils/http";
import { parseLimit, parseOffset } from "../utils/request";

import { triggerIncident, listIncidents, getIncidentByKey, updateIncidentStatus } from "../services/incidentsService";
import { getRoomById } from "../services/roomsService";

type App = { Bindings: Bindings };
type Ctx = Context<App>;

/**
 * GET /api/incidents
 * Dashboard list (most recent first)
 */
export async function listIncidentsHandler(c: Ctx) {
  const limit = parseLimit(c.req.query("limit"), 50, 1, 200);
  const offset = parseOffset(c.req.query("offset"), 0, 0);

  const incidents = await listIncidents(c.env, limit, offset);
  return c.json({ incidents, limit, offset });
}

/**
 * GET /api/incidents/:incidentKey
 * Detail view for dashboard
 */
export async function getIncidentDetailHandler(c: Ctx) {
  const incidentKey = c.req.param("incidentKey");

  const detail = await getIncidentByKey(c.env, incidentKey);
  if (!detail) return errorResponse(c, 404, "NOT_FOUND", "Incident not found");

  return c.json(detail);
}

/**
 * POST /api/incidents/trigger
 * System-driven idempotent trigger.
 */
export async function triggerIncidentHandler(c: Ctx) {
  const body = await c.req.json().catch(() => null);
  const parsed = IncidentTriggerSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const result = await triggerIncident(c.env, parsed.data);

  const room = await getRoomById(c.env, result.roomId);
  if (!room) {
    // Internal consistency problem: incident row points to missing room.
    return errorResponse(c, 500, "INTERNAL_ERROR", "Room not found for incident");
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
}

/**
 * POST /api/incidents/create
 * Human-driven creation that mirrors system trigger.
 */
export async function createIncidentHandler(c: Ctx) {
  const body = await c.req.json().catch(() => null);
  const parsed = IncidentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const incidentKey = `manual:${crypto.randomUUID()}`;

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
    return errorResponse(c, 500, "INTERNAL_ERROR", "Room not found for incident");
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
}

/**
 * PATCH /api/incidents/:incidentKey
 * Update incident status (open/resolved).
 */
export async function updateIncidentHandler(c: Ctx) {
  const incidentKey = c.req.param("incidentKey");
  const body = await c.req.json().catch(() => null);
  const parsed = IncidentUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const updated = await updateIncidentStatus(c.env, incidentKey, parsed.data.status);
  if (!updated) return errorResponse(c, 404, "NOT_FOUND", "Incident not found");

  return c.json(updated);
}
