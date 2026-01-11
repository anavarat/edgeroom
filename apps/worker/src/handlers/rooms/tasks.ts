// edgeroom/apps/worker/src/handlers/rooms/tasks.ts
import { CreateTaskSchema, UpdateTaskSchema } from "@edgeroom/shared";
import { errorResponse, zodIssues } from "../../utils/http";
import { broadcastToRoom } from "../../utils/roomDo";
import { createTask, listTasks, updateTask } from "../../services/tasksService";
import type { Ctx } from "./helpers";
import { requireRoom, parseJsonBody } from "./helpers";

export async function listTasksHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const tasks = await listTasks(c.env, roomId);
  return c.json({ tasks });
}

export async function createTaskHandler(c: Ctx) {
  const roomId = c.req.param("id");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await parseJsonBody(c);
  const parsed = CreateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const task = await createTask(c.env, roomId, parsed.data);
  await broadcastToRoom(c.env, roomId, { kind: "task:created", task });

  return c.json(task, 201);
}

export async function updateTaskHandler(c: Ctx) {
  const roomId = c.req.param("id");
  const taskId = c.req.param("taskId");

  const r = await requireRoom(c, roomId);
  if (!r.ok) return r.res;

  const body = await parseJsonBody(c);
  const parsed = UpdateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, 400, "VALIDATION_ERROR", "Validation failed", zodIssues(parsed.error));
  }

  const updated = await updateTask(c.env, roomId, taskId, parsed.data);
  if (!updated) return errorResponse(c, 404, "NOT_FOUND", "Task not found");

  await broadcastToRoom(c.env, roomId, { kind: "task:updated", task: updated });

  return c.json(updated);
}
