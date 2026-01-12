// edgeroom/apps/web/src/hooks/useRoomStateQuery.ts
import { useQuery } from "@tanstack/react-query";
import { getRoomState } from "../api/rooms";

export function useRoomStateQuery(
  roomId: string | undefined,
  params?: { eventsLimit?: number; tasksLimit?: number; messagesLimit?: number }
) {
  return useQuery({
    queryKey: ["roomState", roomId, params],
    enabled: Boolean(roomId),
    queryFn: () => {
      if (!roomId) {
        return Promise.reject(new Error("Room id required"));
      }
      return getRoomState(roomId, params);
    },
  });
}
