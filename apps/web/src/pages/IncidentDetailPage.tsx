import { useMemo } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useIncidentDetail } from "../hooks/useIncidentDetail";

type TimelineItem = {
  id: string;
  kind: "event" | "task";
  title: string;
  createdAt: string;
  meta?: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function IncidentDetailPage() {
  const { incidentKey } = useParams();
  const { data, isLoading, error } = useIncidentDetail(incidentKey);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!data) return [];
    const events: TimelineItem[] = data.events.map((event) => ({
      id: event.id,
      kind: "event",
      title: event.message,
      createdAt: event.createdAt,
      meta: `Event • ${event.author.displayName}`,
    }));
    const tasks: TimelineItem[] = data.tasks.map((task) => ({
      id: task.id,
      kind: "task",
      title: task.title,
      createdAt: task.createdAt,
      meta: `Task • ${task.status}${task.assignee ? ` • Assigned to ${task.assignee}` : ""}`,
    }));
    return [...events, ...tasks].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }, [data]);

  if (isLoading) {
    return <Typography>Loading incident…</Typography>;
  }

  if (error || !data) {
    return (
      <Alert severity="error">
        Failed to load incident details.
      </Alert>
    );
  }

  const summary = data.events[0]?.message ?? "No summary available.";

  return (
    <Stack spacing={3} sx={{ height: "100%", minHeight: 0 }}>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          Incident detail
        </Typography>
        <Typography variant="h4">{data.incidentKey}</Typography>
        <Typography variant="body2" color="text.secondary">
          Created {formatDate(data.incidentCreatedAt)}
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle1">Summary</Typography>
          <Typography color="text.secondary">{summary}</Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">Room</Typography>
            <Button
              component={RouterLink}
              to={`/rooms/${data.room.id}`}
              size="small"
            >
              View room
            </Button>
          </Stack>
          <Typography color="text.secondary">{data.room.name}</Typography>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 2, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Timeline
        </Typography>
        <Stack spacing={2} sx={{ overflowY: "auto", pr: 1 }}>
          {timeline.length === 0 && (
            <Typography color="text.secondary">
              No events or tasks yet.
            </Typography>
          )}
          {timeline.map((item, index) => (
            <Stack key={`${item.kind}-${item.id}`} spacing={0.5}>
              <Typography variant="body2">{item.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(item.createdAt)} • {item.meta}
              </Typography>
              {index < timeline.length - 1 && <Divider />}
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
