import { useMutation } from "@tanstack/react-query";
import type {
  CreateChatMessageInput,
  CreateEventInput,
  CreateTaskInput,
  UpdateTaskInput,
} from "@edgeroom/shared";
import { createRoomEvent, createRoomMessage, createRoomTask, updateRoomTask } from "../api/rooms";

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

export function useCreateRoomEvent(roomId: string | undefined) {
  return useMutation({
    mutationFn: (input: CreateEventInput) => {
      if (!roomId) {
        return Promise.reject(new Error("Room id required"));
      }
      return createRoomEvent(roomId, input);
    },
  });
}

export function useCreateRoomTask(roomId: string | undefined) {
  return useMutation({
    mutationFn: (input: CreateTaskInput) => {
      if (!roomId) {
        return Promise.reject(new Error("Room id required"));
      }
      return createRoomTask(roomId, input);
    },
  });
}

export function useUpdateRoomTask(roomId: string | undefined) {
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => {
      if (!roomId) {
        return Promise.reject(new Error("Room id required"));
      }
      return updateRoomTask(roomId, taskId, input);
    },
  });
}
