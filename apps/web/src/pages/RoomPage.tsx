import { useEffect, useMemo, useReducer } from "react";
import { useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Presence } from "@edgeroom/shared";
import { useRoomStateQuery } from "../hooks/useRoomStateQuery";
import { useRoomWebSocket } from "../hooks/useRoomWebSocket";
import { initialRoomState, roomReducer } from "../state/roomReducer";

type UserIdentity = { userId: string; displayName: string };

function loadIdentity(): UserIdentity | null {
  const userId = localStorage.getItem("edgeroom.userId");
  const displayName = localStorage.getItem("edgeroom.displayName");
  if (!userId || !displayName) return null;
  return { userId, displayName };
}

function ensureIdentity(): UserIdentity {
  const existing = loadIdentity();
  if (existing) return existing;
  const identity = { userId: crypto.randomUUID(), displayName: "Guest" };
  localStorage.setItem("edgeroom.userId", identity.userId);
  localStorage.setItem("edgeroom.displayName", identity.displayName);
  return identity;
}

export default function RoomPage() {
  const { roomId } = useParams();
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);
  const { data, isLoading, error } = useRoomStateQuery(roomId);
  const identity = useMemo<UserIdentity>(() => ensureIdentity(), []);
  const user = useMemo<Presence | null>(() => identity, [identity]);

  useEffect(() => {
    if (!data) return;
    dispatch({ type: "HYDRATE", payload: data });
  }, [data]);

  useRoomWebSocket({ roomId, user, dispatch });

  if (isLoading) {
    return (
      <Stack alignItems="center" spacing={2}>
        <CircularProgress />
        <Typography>Loading room…</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load room state. Please try again.
      </Alert>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="h5">{state.room?.name ?? "Room"}</Typography>
      <Typography color="text.secondary">
        Events: {state.events.length} · Tasks: {state.tasks.length} ·
        Presence: {state.presence.length}
      </Typography>
    </Stack>
  );
}
