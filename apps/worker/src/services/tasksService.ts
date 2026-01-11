// edgeroom/apps/worker/src/services/tasksService.ts

import type { Bindings } from "../types";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@edgeroom/shared";

function nowIso(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

export async function createTask(
  env: Bindings,
  roomId: string,
  input: CreateTaskInput
): Promise<Task> {
  const taskId = id();
  const createdAt = nowIso();
  const updatedAt = createdAt;

  // Note: CreateTaskInput includes createdBy; we’re not persisting it yet (schema dependent).
  await env.DB.prepare(
    "INSERT INTO tasks (id, room_id, title, status, created_at, updated_at, assignee) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(taskId, roomId, input.title, "open", createdAt, updatedAt, input.assignee ?? null)
    .run();

  return {
    id: taskId,
    roomId,
    title: input.title,
    status: "open",
    createdAt,
    updatedAt,
    assignee: input.assignee,
  };
}

export async function listTasks(env: Bindings, roomId: string, limit = 200): Promise<Task[]> {
  const res = await env.DB.prepare(
    "SELECT id, room_id as roomId, title, status, created_at as createdAt, updated_at as updatedAt, assignee FROM tasks WHERE room_id = ? ORDER BY created_at ASC LIMIT ?"
  )
    .bind(roomId, limit)
    .all();

  return (res.results ?? []) as Task[];
}

export async function updateTask(
  env: Bindings,
  roomId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const existing = await env.DB.prepare(
    "SELECT id, room_id as roomId, title, status, created_at as createdAt, updated_at as updatedAt, assignee FROM tasks WHERE id = ? AND room_id = ?"
  )
    .bind(taskId, roomId)
    .first();

  if (!existing) return null;

  const updatedAt = nowIso();
  const nextTitle = (input.title ?? (existing as any).title) as string;
  const nextStatus = (input.status ?? (existing as any).status) as "open" | "done";
  const nextAssignee =
    input.assignee === undefined ? (existing as any).assignee : input.assignee; // may be null

  await env.DB.prepare(
    "UPDATE tasks SET title = ?, status = ?, assignee = ?, updated_at = ? WHERE id = ? AND room_id = ?"
  )
    .bind(nextTitle, nextStatus, nextAssignee ?? null, updatedAt, taskId, roomId)
    .run();

  return {
    id: (existing as any).id,
    roomId: (existing as any).roomId,
    title: nextTitle,
    status: nextStatus,
    createdAt: (existing as any).createdAt,
    updatedAt,
    assignee: nextAssignee ?? undefined,
  };
}
