// edgeroom/apps/worker/src/handlers/rooms/events.ts
import { CreateEventSchema } from "@edgeroom/shared";
import { errorResponse, zodIssues } from "../../utils/http";
import { broadcastToRoom } from "../../utils/roomDo";
import { createEvent, listEvents } from "../../services/eventsService";
import type { Ctx } from "./helpers";
import { requireRoom, parseJsonBody } from "./helpers";

export async function listEventsHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const events = await listEvents(c.env, roomId);
  return c.json({ events });
}

export async function createEventHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await parseJsonBody(c);
  const parsed = CreateEventSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const event = await createEvent(c.env, roomId, parsed.data);
  await broadcastToRoom(c.env, roomId, { kind: "event:created", event });

  return c.json(event, 201);
}
