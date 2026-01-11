// edgeroom/apps/worker/src/index.ts

import { Hono } from "hono";
import { z } from "zod";
import { DurableObject } from "cloudflare:workers";

import { WsHelloSchema } from "@edgeroom/shared";
import type { Presence, WsServerMessage } from "@edgeroom/shared";

import type { Bindings } from "./types";
import { roomsRoutes } from "./routes/rooms";
import { incidentsRoutes } from "./routes/incidents";
import { errorResponse } from "./utils/http";



const app = new Hono<{ Bindings: Bindings }>();

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return errorResponse(c, 500, "INTERNAL_ERROR", "Internal Server Error");
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
      if (request.method === "POST" && url.pathname === "/broadcast") {
        const body = await request.json().catch(() => null);

        // Define strict schemas for server messages (runtime validation)
        const PresenceMsgSchema = z.object({
          kind: z.literal("presence"),
          users: z.array(
            z.object({
              userId: z.string().min(1),
              displayName: z.string().min(1),
            })
          ),
        });

        const EventCreatedMsgSchema = z.object({
          kind: z.literal("event:created"),
          event: z.object({
            id: z.string().min(1),
            roomId: z.string().min(1),
            type: z.enum(["note", "status", "link"]),
            message: z.string(),
            createdAt: z.string().min(1),
            author: z.object({
              userId: z.string().min(1),
              displayName: z.string().min(1),
            }),
          }),
        });

        const TaskSchema = z.object({
          id: z.string().min(1),
          roomId: z.string().min(1),
          title: z.string().min(1),
          status: z.enum(["open", "done"]),
          createdAt: z.string().min(1),
          updatedAt: z.string().min(1),
          assignee: z.string().min(1).optional(),
        });

        const TaskCreatedMsgSchema = z.object({
          kind: z.literal("task:created"),
          task: TaskSchema,
        });

        const TaskUpdatedMsgSchema = z.object({
          kind: z.literal("task:updated"),
          task: TaskSchema,
        });

        // ✅ NEW: chat:message payload shape
        const ChatMessageSchema = z.object({
          id: z.string().min(1),
          roomId: z.string().min(1),
          message: z.string().min(1),
          createdAt: z.string().min(1),
          author: z.object({
            userId: z.string().min(1),
            displayName: z.string().min(1),
          }),
        });

        // ✅ NEW: server message wrapper for chat
        const ChatMessageMsgSchema = z.object({
          kind: z.literal("chat:message"),
          message: ChatMessageSchema,
        });

        const ErrorMsgSchema = z.object({
          kind: z.literal("error"),
          message: z.string().min(1),
        });

        const WsServerMessageSchema = z.union([
          PresenceMsgSchema,
          EventCreatedMsgSchema,
          TaskCreatedMsgSchema,
          TaskUpdatedMsgSchema,
          ChatMessageMsgSchema, // ✅ include it here
          ErrorMsgSchema,
        ]);

        const parsed = WsServerMessageSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid broadcast message",
                details: parsed.error.issues.map((i) => ({
                  path: i.path.join("."),
                  message: i.message,
                })),
              },
            }),
            {
              status: 400,
              headers: { "content-type": "application/json; charset=utf-8" },
            }
          );
        }

        // Broadcast only validated payload
        this.broadcast(parsed.data as WsServerMessage);
        return new Response(null, { status: 204 });
      }

      // consistent error shape for non-existent DO routes
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Not found",
          },
        }),
        {
          status: 404,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
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
