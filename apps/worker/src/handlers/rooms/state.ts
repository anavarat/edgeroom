// edgeroom/apps/worker/src/handlers/rooms/state.ts
import { parseLimit } from "../../utils/request";
import { listEvents } from "../../services/eventsService";
import { listTasks } from "../../services/tasksService";
import { listMessages } from "../../services/messagesService";
import type { Ctx } from "./helpers";
import { requireRoom } from "./helpers";

export async function getRoomStateHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const safeEventsLimit = parseLimit(c.req.query("eventsLimit"), 200);
  const safeTasksLimit = parseLimit(c.req.query("tasksLimit"), 200);
  const safeMessagesLimit = parseLimit(c.req.query("messagesLimit"), 200);

  const [events, tasks, messages] = await Promise.all([
    listEvents(c.env, roomId, safeEventsLimit),
    listTasks(c.env, roomId, safeTasksLimit),
    listMessages(c.env, roomId, safeMessagesLimit),
  ]);

  return c.json({ room: r.room, events, tasks, messages });
}
