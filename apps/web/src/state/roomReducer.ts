import type { ChatMessage, Presence, Room, RoomEvent, Task } from "@edgeroom/shared";

export type RoomState = {
  room: Room | null;
  events: RoomEvent[];
  tasks: Task[];
  messages: ChatMessage[];
  presence: Presence[];
};

export type RoomHydration = {
  room: Room;
  events: RoomEvent[];
  tasks: Task[];
  messages: ChatMessage[];
};

export type RoomAction =
  | { type: "HYDRATE"; payload: RoomHydration }
  | { type: "PRESENCE_UPDATED"; payload: Presence[] }
  | { type: "EVENT_CREATED"; payload: RoomEvent }
  | { type: "TASK_CREATED"; payload: Task }
  | { type: "TASK_UPDATED"; payload: Task }
  | { type: "CHAT_MESSAGE_CREATED"; payload: ChatMessage };

export const initialRoomState: RoomState = {
  room: null,
  events: [],
  tasks: [],
  messages: [],
  presence: [],
};

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case "HYDRATE":
      return {
        room: action.payload.room,
        events: action.payload.events,
        tasks: action.payload.tasks,
        messages: action.payload.messages,
        presence: state.presence,
      };
    case "PRESENCE_UPDATED":
      return { ...state, presence: action.payload };
    case "EVENT_CREATED":
      return { ...state, events: [...state.events, action.payload] };
    case "TASK_CREATED":
      return { ...state, tasks: [...state.tasks, action.payload] };
    case "TASK_UPDATED":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case "CHAT_MESSAGE_CREATED":
      return { ...state, messages: [...state.messages, action.payload] };
    default:
      return state;
  }
}
