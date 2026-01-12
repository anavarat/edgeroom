// edgeroom/apps/web/src/pages/RoomPage.tsx
import { useEffect, useMemo, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { ChatMessage } from "@edgeroom/shared";
import { useCreateRoomEvent, useCreateRoomMessage, useCreateRoomTask } from "../hooks/useRoomMessages";

export default function RoomPage() {
  const { roomId } = useParams();
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);
  const { data, isLoading, error } = useRoomStateQuery(roomId);
  const { identity } = useIdentity();
  const user = identity;
  const createMessage = useCreateRoomMessage(roomId);
  const createEvent = useCreateRoomEvent(roomId);
  const createTask = useCreateRoomTask(roomId);
  const [messageText, setMessageText] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [convertMode, setConvertMode] = useState<"event" | "task" | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const allEvents = useMemo(() => state.events.slice().reverse(), [state.events]);
  const allTasks = useMemo(() => state.tasks.slice().reverse(), [state.tasks]);
  const recentMessages = useMemo(() => state.messages.slice(-20), [state.messages]);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

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

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    message: ChatMessage
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const openConvertDialog = (mode: "event" | "task") => {
    if (!selectedMessage) return;
    setConvertMode(mode);
    if (mode === "task") {
      setTaskTitle(selectedMessage.message);
      setTaskAssignee("");
    }
  };

  const handleCloseDialog = () => {
    setConvertMode(null);
  };

  const handleConvertToEvent = async () => {
    if (!identity || !selectedMessage) return;
    await createEvent.mutateAsync({
      type: "note",
      message: selectedMessage.message,
      createdBy: identity,
    });
    handleCloseDialog();
  };

  const handleConvertToTask = async () => {
    if (!identity || !selectedMessage || !taskTitle.trim()) return;
    await createTask.mutateAsync({
      title: taskTitle.trim(),
      assignee: taskAssignee.trim() || undefined,
      createdBy: identity,
    });
    handleCloseDialog();
  };

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
                    Events ({state.events.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.5}>
                    {allEvents.length === 0 && (
                      <Typography color="text.secondary" variant="body2">
                        No events yet.
                      </Typography>
                    )}
                    {allEvents.map((event) => (
                      <Stack key={event.id} spacing={0.25}>
                        <Typography variant="body2">{event.message}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(event.createdAt)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
              <Divider />
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Tasks ({state.tasks.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.5}>
                    {allTasks.length === 0 && (
                      <Typography color="text.secondary" variant="body2">
                        No tasks yet.
                      </Typography>
                    )}
                    {allTasks.map((task) => (
                      <Stack key={task.id} spacing={0.25}>
                        <Typography variant="body2">{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(task.createdAt)}
                          {task.assignee ? ` • Assigned to: ${task.assignee}` : ""}
                        </Typography>
                      </Stack>
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
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">
                        {message.author.displayName}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(event) => handleOpenMenu(event, message)}
                      >
                        <MoreVertIcon fontSize="inherit" />
                      </IconButton>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {message.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(message.createdAt)}
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
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            openConvertDialog("event");
          }}
        >
          Convert to event
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            openConvertDialog("task");
          }}
        >
          Convert to task
        </MenuItem>
      </Menu>
      <Dialog open={convertMode === "event"} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Convert to event</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will create a note event using the chat message.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2">
              {selectedMessage?.author.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedMessage?.message}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConvertToEvent}
            disabled={!identity || createEvent.isPending}
          >
            Create event
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={convertMode === "task"} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Convert to task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Task title"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              fullWidth
            />
            <TextField
              label="Assignee (optional)"
              value={taskAssignee}
              onChange={(event) => setTaskAssignee(event.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConvertToTask}
            disabled={!identity || !taskTitle.trim() || createTask.isPending}
          >
            Create task
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
