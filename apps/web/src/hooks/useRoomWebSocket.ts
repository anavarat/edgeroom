import { useEffect, useMemo, useRef } from "react";
import type { Presence, WsClientHello, WsServerMessage } from "@edgeroom/shared";
import { WsServerMessageSchema } from "@edgeroom/shared";
import type { RoomAction } from "../state/roomReducer";

type UseRoomWebSocketParams = {
  roomId: string | undefined;
  user: Presence | null;
  dispatch: React.Dispatch<RoomAction>;
};

export function useRoomWebSocket({ roomId, user, dispatch }: UseRoomWebSocketParams) {
  const socketRef = useRef<WebSocket | null>(null);
  const wsUrl = useMemo(() => {
    if (!roomId) return null;
    const envOrigin = import.meta.env.VITE_WS_ORIGIN as string | undefined;
    if (envOrigin) {
      return `${envOrigin.replace(/\/$/, "")}/api/rooms/${roomId}/ws`;
    }
    const url = new URL(window.location.href);
    const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = url.port === "5173" ? `${url.hostname}:8787` : url.host;
    return `${wsProtocol}//${wsHost}/api/rooms/${roomId}/ws`;
  }, [roomId]);

  useEffect(() => {
    if (!wsUrl || !user) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const socket = new WebSocket(wsUrl);
    let isActive = true;
    socketRef.current = socket;

    const sendHello = () => {
      if (!isActive) return;
      const hello: WsClientHello = { kind: "hello", user };
      console.info("[ws] send hello", hello);
      socket.send(JSON.stringify(hello));
    };

    const handleMessage = (event: MessageEvent) => {
      const raw = typeof event.data === "string" ? event.data : "";
      console.info("[ws] recv raw", raw);
      let parsed: WsServerMessage | null = null;
      try {
        const json = JSON.parse(raw);
        const result = WsServerMessageSchema.safeParse(json);
        if (!result.success) return;
        parsed = result.data;
      } catch {
        return;
      }

      console.info("[ws] recv", parsed);
      switch (parsed.kind) {
        case "presence":
          dispatch({ type: "PRESENCE_UPDATED", payload: parsed.users });
          break;
        case "event:created":
          dispatch({ type: "EVENT_CREATED", payload: parsed.event });
          break;
        case "task:created":
          dispatch({ type: "TASK_CREATED", payload: parsed.task });
          break;
        case "task:updated":
          dispatch({ type: "TASK_UPDATED", payload: parsed.task });
          break;
        case "chat:message":
          dispatch({ type: "CHAT_MESSAGE_CREATED", payload: parsed.message });
          break;
        case "error":
          // Optional: surface later via UI.
          break;
      }
    };

    const handleClose = () => {
      socketRef.current = null;
    };

    socket.addEventListener("open", sendHello);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);

    return () => {
      isActive = false;
      socket.removeEventListener("open", sendHello);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      if (socket.readyState !== WebSocket.CLOSED) socket.close();
      socketRef.current = null;
    };
  }, [wsUrl, user, dispatch]);
}
