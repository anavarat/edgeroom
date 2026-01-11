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
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    // Track socket before hello arrives
    this.sockets.set(server, { userId: "pending", displayName: "Pending" });

    // ✅ Immediately send current presence snapshot to the newly connected client
    this.send(server, { kind: "presence", users: this.currentUsers() });

    server.addEventListener("message", (evt) => {
      try {
        const raw = typeof evt.data === "string" ? evt.data : "";
        const json = JSON.parse(raw);

        const current = this.sockets.get(server);
        const isPending = !current || current.userId === "pending";

        // ✅ Only allow hello once per socket
        if (!isPending) {
          this.send(server, { kind: "error", message: "Already joined" });
          return; // or just `return;` to silently ignore
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
    // Deduplicate by userId (so multiple tabs/sockets for same user show once)
    const byUserId = new Map<string, Presence>();

    for (const p of this.sockets.values()) {
      if (p.userId === "pending") continue;

      // First write wins (stable). You can switch to "last write wins" if you prefer.
      // remove the block below for last write wins
      if (!byUserId.has(p.userId)) {
        byUserId.set(p.userId, p);
      }
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
