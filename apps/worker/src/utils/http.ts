// edgeroom/apps/worker/src/utils/http.ts

import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return c.json(
    {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

export function zodIssues(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}
