// edgeroom/apps/worker/src/utils/roomDo.ts
import type { Bindings } from "../types";
import type { WsServerMessage } from "@edgeroom/shared";

export async function broadcastToRoom(env: Bindings, roomId: string, msg: WsServerMessage) {
  try {
    const id = env.ROOM_DO.idFromName(roomId);
    const stub = env.ROOM_DO.get(id);

    await stub.fetch("https://room-do/broadcast", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(msg),
    });
  } catch (e) {
    // Don’t fail the API call if WS broadcast fails — DB write is the source of truth.
    console.warn("Broadcast failed:", e);
  }
}
