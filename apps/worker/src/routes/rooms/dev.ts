// edgeroom/apps/worker/src/routes/rooms/dev.ts
import { Hono } from "hono";
import type { Bindings } from "../../types";
import { devBroadcastProxyHandler } from "../../handlers/rooms/dev";

type App = { Bindings: Bindings };
export const devRoutes = new Hono<App>();

/**
 * Best practice: mount this only in dev/staging.
 * In Cloudflare Workers you can control this via an ENV var, e.g. env.ENVIRONMENT === "dev"
 * Without env info here, we just keep the route but isolate it in a dev router.
 */
devRoutes.post("/broadcast", devBroadcastProxyHandler);
