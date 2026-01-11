// edgeroom/apps/worker/src/middleware/error.ts
import type { Hono } from "hono";
import type { Env } from "hono";
import { errorResponse } from "../utils/http";

export function applyErrorHandling<E extends Env>(app: Hono<E>) {
  app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return errorResponse(c, 500, "INTERNAL_ERROR", "Internal Server Error");
  });
}
