// edgeroom/apps/web/src/pages/RoomPage.tsx
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { useRoomStateQuery } from "../hooks/useRoomStateQuery";
import { useRoomWebSocket } from "../hooks/useRoomWebSocket";
import { initialRoomState, roomReducer } from "../state/roomReducer";
import { useIdentity } from "../hooks/useIdentity";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { ChatMessage } from "@edgeroom/shared";
import {
  useCreateRoomEvent,
  useCreateRoomMessage,
  useCreateRoomTask,
  useUpdateRoomTask,
} from "../hooks/useRoomMessages";
import Box from "@mui/material/Box";
import { useIncidents } from "../hooks/useIncidents";
import { Link as RouterLink } from "react-router-dom";

export default function RoomPage() {
  const { roomId } = useParams();
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);
  const { data, isLoading, error } = useRoomStateQuery(roomId);
  const { data: incidentsData } = useIncidents();
  const { identity } = useIdentity();
  const user = identity;

  const createMessage = useCreateRoomMessage(roomId);
  const createEvent = useCreateRoomEvent(roomId);
  const createTask = useCreateRoomTask(roomId);
  const updateTask = useUpdateRoomTask(roomId);

  const [messageText, setMessageText] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null
  );
  const [convertMode, setConvertMode] = useState<"event" | "task" | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  const allEvents = useMemo(() => state.events.slice().reverse(), [state.events]);
  const allTasks = useMemo(() => state.tasks.slice().reverse(), [state.tasks]);
  const recentMessages = useMemo(
    () => state.messages.slice(-20),
    [state.messages]
  );
  const incidentKey = useMemo(() => {
    if (!incidentsData?.incidents || !state.room?.id) return null;
    const match = incidentsData.incidents.find(
      (incident) => incident.room.id === state.room?.id
    );
    return match?.incidentKey ?? null;
  }, [incidentsData?.incidents, state.room?.id]);
  const incidentStatus = useMemo(() => {
    if (!incidentsData?.incidents || !state.room?.id) return null;
    const match = incidentsData.incidents.find(
      (incident) => incident.room.id === state.room?.id
    );
    return match?.status ?? null;
  }, [incidentsData?.incidents, state.room?.id]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  useEffect(() => {
    if (!data) return;
    dispatch({ type: "HYDRATE", payload: data });
  }, [data]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [recentMessages.length]);

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
      <Alert severity="error">Failed to load room state. Please try again.</Alert>
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
    <Box
      sx={{
        height: "calc(100vh - 64px - 48px)",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0, width: "100%" }}>
        <Stack spacing={0.75}>
          <Typography variant="overline" color="text.secondary">
            EdgeRoom • Incident Room
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Typography variant="h4">
              {state.room?.name ?? "Incident Room"}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ ml: { md: "auto" } }}>
              {incidentKey && (
                <Button
                  component={RouterLink}
                  to={`/incidents/${incidentKey}`}
                  size="small"
                >
                  View incident
                </Button>
              )}
              {incidentStatus === "resolved" && (
                <Chip size="small" label="Resolved" color="success" />
              )}
              <Typography variant="body2" color="text.secondary">
                Created {state.room ? formatDate(state.room.createdAt) : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Events: {state.events.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasks: {state.tasks.length}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ flex: 1, minHeight: 0, width: "100%" }}
        >
          <Box sx={{ width: { md: 360 }, flexShrink: 0 }}>
            <Stack spacing={2.5} sx={{ height: "100%" }}>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 260, overflowY: "auto" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle1">Tasks</Typography>
                  {allTasks.length === 0 && (
                    <Typography color="text.secondary" variant="body2">
                      No tasks yet.
                    </Typography>
                  )}
                  <List dense disablePadding>
                    {allTasks.map((task) => (
                      <ListItem key={task.id} disableGutters divider>
                        <ListItemText
                          primary={task.title}
                          secondary={`${formatDate(task.createdAt)}${
                            task.assignee ? ` • Assigned to ${task.assignee}` : ""
                          }`}
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={task.status}
                            color={task.status === "done" ? "success" : "default"}
                          />
                          {task.status !== "done" && (
                            <Button
                              size="small"
                              onClick={() =>
                                updateTask.mutateAsync({
                                  taskId: task.id,
                                  input: { status: "done" },
                                })
                              }
                            >
                              Mark done
                            </Button>
                          )}
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, maxHeight: 260, overflowY: "auto" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle1">Events</Typography>
                  {allEvents.length === 0 && (
                    <Typography color="text.secondary" variant="body2">
                      No events yet.
                    </Typography>
                  )}
                  <Stack spacing={1.5}>
                    {allEvents.map((event) => (
                      <Stack key={event.id} spacing={0.25}>
                        <Typography variant="body2">{event.message}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(event.createdAt)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
            <Paper
              variant="outlined"
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                p: 2,
                minHeight: 0,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">Live chat</Typography>
                <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
                  {state.presence.slice(0, 5).map((p) => (
                    <Tooltip key={p.userId} title={p.displayName} arrow>
                      <Avatar sx={{ width: 28, height: 28 }}>
                        {p.displayName.trim().charAt(0).toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
                  {state.presence.length > 5 && (
                    <Avatar sx={{ width: 28, height: 28 }}>
                      +{state.presence.length - 5}
                    </Avatar>
                  )}
                </Stack>
              </Stack>
              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 1 }}>
                <Stack spacing={2}>
                  {recentMessages.length === 0 && (
                    <Typography color="text.secondary">
                      No chat messages yet.
                    </Typography>
                  )}

                  {recentMessages.map((message) => {
                    const isYou = identity?.userId === message.author.userId;
                    return (
                      <Stack
                        key={message.id}
                        alignItems={isYou ? "flex-end" : "flex-start"}
                      >
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            width: "100%",
                            maxWidth: 520,
                            bgcolor: isYou ? "action.hover" : "background.paper",
                          }}
                        >
                          <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2">
                                {isYou ? "You" : message.author.displayName}
                              </Typography>
                              <Box sx={{ flexGrow: 1 }} />
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
                        </Paper>
                      </Stack>
                    );
                  })}
                  <div ref={messageEndRef} />
                </Stack>
              </Box>

              <Box sx={{ pt: 2 }}>
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
                    disabled={
                      !identity || !messageText.trim() || createMessage.isPending
                    }
                  >
                    Send
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Box>
        </Stack>

        {/* Menu */}
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

        {/* Convert to Event */}
        <Dialog
          open={convertMode === "event"}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
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

        {/* Convert to Task */}
        <Dialog
          open={convertMode === "task"}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
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
    </Box>
  );
}
