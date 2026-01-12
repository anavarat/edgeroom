// edgeroom/apps/web/src/pages/RoomPage.tsx
import { useEffect, useMemo, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import { useRoomStateQuery } from "../hooks/useRoomStateQuery";
import { useRoomWebSocket } from "../hooks/useRoomWebSocket";
import { initialRoomState, roomReducer } from "../state/roomReducer";
import { useIdentity } from "../hooks/useIdentity";
import Grid from "@mui/material/Grid";
import { useCreateRoomMessage } from "../hooks/useRoomMessages";

export default function RoomPage() {
  const { roomId } = useParams();
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);
  const { data, isLoading, error } = useRoomStateQuery(roomId);
  const { identity } = useIdentity();
  const user = identity;
  const createMessage = useCreateRoomMessage(roomId);
  const [messageText, setMessageText] = useState("");
  const topEvents = useMemo(
    () => state.events.slice(-2).reverse(),
    [state.events]
  );
  const topTasks = useMemo(
    () => state.tasks.slice(-2).reverse(),
    [state.tasks]
  );
  const recentMessages = useMemo(() => state.messages.slice(-20), [state.messages]);

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
    <Stack spacing={3}>
      <Typography variant="h5">
        {state.room?.name ?? "Incident Room"}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Participants ({state.presence.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.5}>
                    {state.presence.length === 0 && (
                      <Typography color="text.secondary" variant="body2">
                        No one here yet.
                      </Typography>
                    )}
                    {state.presence.map((p) => (
                      <Typography key={p.userId} variant="body2">
                        {p.displayName}
                      </Typography>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
              <Divider />
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Events (top 2)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.5}>
                    {topEvents.length === 0 && (
                      <Typography color="text.secondary" variant="body2">
                        No events yet.
                      </Typography>
                    )}
                    {topEvents.map((event) => (
                      <Typography key={event.id} variant="body2">
                        {event.message}
                      </Typography>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
              <Divider />
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Tasks (top 2)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.5}>
                    {topTasks.length === 0 && (
                      <Typography color="text.secondary" variant="body2">
                        No tasks yet.
                      </Typography>
                    )}
                    {topTasks.map((task) => (
                      <Typography key={task.id} variant="body2">
                        {task.title}
                      </Typography>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 420 }}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Stack spacing={1} sx={{ flexGrow: 1 }}>
                {recentMessages.length === 0 && (
                  <Typography color="text.secondary">
                    No chat messages yet.
                  </Typography>
                )}
                {recentMessages.map((message) => (
                  <Stack key={message.id} spacing={0.5}>
                    <Typography variant="subtitle2">
                      {message.author.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {message.message}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  placeholder="Type a message"
                  fullWidth
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  disabled={!identity || createMessage.isPending}
                />
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (!identity || !messageText.trim()) return;
                    const next = messageText.trim();
                    setMessageText("");
                    await createMessage.mutateAsync({
                      message: next,
                      createdBy: identity,
                    });
                  }}
                  disabled={!identity || !messageText.trim() || createMessage.isPending}
                >
                  Send
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
