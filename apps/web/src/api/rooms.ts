import type {
  ChatMessage,
  CreateEventInput,
  CreateTaskInput,
  Room,
  RoomEvent,
  Task,
  UpdateTaskInput,
} from "@edgeroom/shared";
import { requestJson } from "./client";

export type RoomStateResponse = {
  room: Room;
  events: RoomEvent[];
  tasks: Task[];
  messages: ChatMessage[];
};

export async function getRoom(roomId: string) {
  return requestJson<Room>(`/api/rooms/${roomId}`);
}

export async function getRoomState(
  roomId: string,
  params?: { eventsLimit?: number; tasksLimit?: number; messagesLimit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.eventsLimit) qs.set("eventsLimit", String(params.eventsLimit));
  if (params?.tasksLimit) qs.set("tasksLimit", String(params.tasksLimit));
  if (params?.messagesLimit) qs.set("messagesLimit", String(params.messagesLimit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return requestJson<RoomStateResponse>(`/api/rooms/${roomId}/state${suffix}`);
}

export async function listRoomEvents(roomId: string) {
  return requestJson<{ events: RoomEvent[] }>(`/api/rooms/${roomId}/events`);
}

export async function createRoomEvent(roomId: string, input: CreateEventInput) {
  return requestJson<RoomEvent>(`/api/rooms/${roomId}/events`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listRoomTasks(roomId: string) {
  return requestJson<{ tasks: Task[] }>(`/api/rooms/${roomId}/tasks`);
}

export async function createRoomTask(roomId: string, input: CreateTaskInput) {
  return requestJson<Task>(`/api/rooms/${roomId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRoomTask(
  roomId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  return requestJson<Task>(`/api/rooms/${roomId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
