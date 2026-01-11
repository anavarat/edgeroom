// edgeroom/apps/worker/src/routes/rooms/tasks.ts
import { Hono } from "hono";
import type { Bindings } from "../../types";
import { listTasksHandler, createTaskHandler, updateTaskHandler } from "../../handlers/rooms/tasks";

type App = { Bindings: Bindings };
export const tasksRoutes = new Hono<App>();

tasksRoutes.get("/tasks", listTasksHandler);
tasksRoutes.post("/tasks", createTaskHandler);
tasksRoutes.patch("/tasks/:taskId", updateTaskHandler);
