import { useMutation } from "@tanstack/react-query";
import type { CreateChatMessageInput } from "@edgeroom/shared";
import { createRoomMessage } from "../api/rooms";

export function useCreateRoomMessage(roomId: string | undefined) {
  return useMutation({
    mutationFn: (input: CreateChatMessageInput) => {
      if (!roomId) {
        return Promise.reject(new Error("Room id required"));
      }
      return createRoomMessage(roomId, input);
    },
  });
}
