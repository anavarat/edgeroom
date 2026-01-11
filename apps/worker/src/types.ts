// edgeroom/apps/worker/src/types.ts
import type { CreateRoomInput } from "@edgeroom/shared";

export type Bindings = {
  DB: D1Database;
  ROOM_DO: DurableObjectNamespace;
};
