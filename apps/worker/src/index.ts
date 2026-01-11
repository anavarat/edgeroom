// edgeroom/apps/worker/src/index.ts

import { Hono } from "hono";
import { DurableObject } from "cloudflare:workers";

import { WsHelloSchema } from "@edgeroom/shared";
import type { Presence, WsServerMessage } from "@edgeroom/shared";

import type { Bindings } from "./types";
import { roomsRoutes } from "./routes/rooms";
import { incidentsRoutes } from "./routes/incidents";

const app = new Hono<{ Bindings: Bindings }>();

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export class RoomDurableObject extends DurableObject<Bindings> {
  private sockets = new Map<WebSocket, Presence>();

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ----------------------------
    // A) Non-WS HTTP endpoints (broadcast)
    // ----------------------------
    if (request.headers.get("Upgrade") !== "websocket") {
      // Internal broadcast endpoint: Worker -> DO -> broadcast to sockets
      if (request.method === "POST" && url.pathname === "/broadcast") {
        const body = await request.json().catch(() => null);

        if (!body || typeof body !== "object") {
          return new Response("Invalid payload", { status: 400 });
        }

        // Minimal shape check
        const kind = (body as any).kind;
        if (typeof kind !== "string") {
          return new Response("Missing kind", { status: 400 });
        }

        // Accept only known server message kinds
        const allowed = new Set([
          "presence",
          "event:created",
          "task:created",
          "task:updated",
          "error",
        ]);
        if (!allowed.has(kind)) {
          return new Response("Unsupported kind", { status: 400 });
        }

        // Broadcast as-is (trusted internal caller)
        this.broadcast(body as WsServerMessage);
        return new Response(null, { status: 204 });
      }

      return new Response("Not found", { status: 404 });
    }

    // ----------------------------
    // B) WebSocket upgrade path
    // ----------------------------
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    // Track socket before hello arrives
    this.sockets.set(server, { userId: "pending", displayName: "Pending" });

    // Immediately send presence snapshot to new client
    this.send(server, { kind: "presence", users: this.currentUsers() });

    server.addEventListener("message", (evt) => {
      try {
        const raw = typeof evt.data === "string" ? evt.data : "";
        const json = JSON.parse(raw);

        const current = this.sockets.get(server);
        const isPending = !current || current.userId === "pending";

        // Only allow hello once per socket
        if (!isPending) {
          this.send(server, { kind: "error", message: "Already joined" });
          return;
        }

        const parsed = WsHelloSchema.safeParse(json);
        if (!parsed.success) {
          this.send(server, {
            kind: "error",
            message: "Expected {kind:'hello', user:{userId, displayName}} as first message",
          });
          return;
        }

        this.sockets.set(server, parsed.data.user);
        this.broadcastPresence();
      } catch {
        this.send(server, { kind: "error", message: "Bad message format (expected JSON)" });
      }
    });

    const onClose = () => {
      this.sockets.delete(server);
      this.broadcastPresence();
    };

    server.addEventListener("close", onClose);
    server.addEventListener("error", onClose);

    return new Response(null, { status: 101, webSocket: client });
  }

  private send(ws: WebSocket, msg: WsServerMessage) {
    ws.send(JSON.stringify(msg));
  }

  private broadcast(msg: WsServerMessage) {
    const data = JSON.stringify(msg);
    for (const ws of this.sockets.keys()) {
      try {
        ws.send(data);
      } catch {
        // ignore; close/error handler will cleanup
      }
    }
  }

  private currentUsers(): Presence[] {
    const byUserId = new Map<string, Presence>();

    for (const p of this.sockets.values()) {
      if (p.userId === "pending") continue;
      if (!byUserId.has(p.userId)) byUserId.set(p.userId, p);
    }

    return Array.from(byUserId.values());
  }

  private broadcastPresence() {
    this.broadcast({ kind: "presence", users: this.currentUsers() });
  }
}

// HealthCheck Endpoints
app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/db-ping", async (c) => {
  const result = await c.env.DB.prepare("SELECT 1 as one").first();
  return c.json({ ok: true, db: result });
});

// WebSocket upgrade route -> forward to per-room Durable Object
app.get("/api/rooms/:id/ws", async (c) => {
  const roomId = c.req.param("id");
  const id = c.env.ROOM_DO.idFromName(roomId);
  const stub = c.env.ROOM_DO.get(id);
  return stub.fetch(c.req.raw);
});

// Mount Routers
app.route("/api/rooms", roomsRoutes);
app.route("/api/incidents", incidentsRoutes);

export default app;
