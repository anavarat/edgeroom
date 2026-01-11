// edgeroom/apps/worker/src/durable/room.do.ts
import { DurableObject } from "cloudflare:workers";
import { WsHelloSchema } from "@edgeroom/shared";
import type { Presence, WsServerMessage } from "@edgeroom/shared";
import { WsServerMessageSchema } from "@edgeroom/shared";
import type { Bindings } from "../types";

export class RoomDurableObject extends DurableObject<Bindings> {
  private sockets = new Map<WebSocket, Presence>();

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") !== "websocket") {
      return this.handleHttp(request, url);
    }

    return this.handleWebSocket(request);
  }

  // ----------------------------
  // HTTP endpoints inside DO
  // ----------------------------
  private async handleHttp(request: Request, url: URL): Promise<Response> {
    if (request.method === "POST" && url.pathname === "/broadcast") {
      const body = await request.json().catch(() => null);

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
          { status: 400, headers: { "content-type": "application/json; charset=utf-8" } }
        );
      }

      this.broadcast(parsed.data as WsServerMessage);
      return new Response(null, { status: 204 });
    }

    return new Response(
      JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" } }),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }

  // ----------------------------
  // WebSocket upgrade path
  // ----------------------------
  private async handleWebSocket(_request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    this.trackPending(server);
    this.send(server, { kind: "presence", users: this.currentUsers() });

    server.addEventListener("message", (evt) => this.onMessage(server, evt));
    server.addEventListener("close", () => this.onClose(server));
    server.addEventListener("error", () => this.onClose(server));

    return new Response(null, { status: 101, webSocket: client });
  }

  private trackPending(ws: WebSocket) {
    this.sockets.set(ws, { userId: "pending", displayName: "Pending" });
  }

  private onMessage(ws: WebSocket, evt: MessageEvent) {
    try {
      const raw = typeof evt.data === "string" ? evt.data : "";
      const json = JSON.parse(raw);

      const current = this.sockets.get(ws);
      const isPending = !current || current.userId === "pending";
      if (!isPending) {
        this.send(ws, { kind: "error", message: "Already joined" });
        return;
      }

      const parsed = WsHelloSchema.safeParse(json);
      if (!parsed.success) {
        this.send(ws, {
          kind: "error",
          message: "Expected {kind:'hello', user:{userId, displayName}} as first message",
        });
        return;
      }

      this.sockets.set(ws, parsed.data.user);
      this.broadcastPresence();
    } catch {
      this.send(ws, { kind: "error", message: "Bad message format (expected JSON)" });
    }
  }

  private onClose(ws: WebSocket) {
    this.sockets.delete(ws);
    this.broadcastPresence();
  }

  // ----------------------------
  // messaging helpers
  // ----------------------------
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
