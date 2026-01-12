import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCreateIncident } from "../hooks/useIncidents";
import { useIdentity } from "../hooks/useIdentity";

export default function NewIncidentPage() {
  const { identity } = useIdentity();
  const createIncident = useCreateIncident();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!identity || !title.trim()) return;
    const result = await createIncident.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      createdBy: identity,
    });
    setCreatedRoomId(result.room.id);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Create Incident</Typography>
      {!identity && (
        <Alert severity="warning">
          Choose a display name to create an incident.
        </Alert>
      )}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Incident title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            fullWidth
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!identity || !title.trim() || createIncident.isPending}
            >
              Create
            </Button>
            <Button variant="outlined" component={RouterLink} to="/">
              Back to incidents
            </Button>
          </Stack>
          {createIncident.isError && (
            <Alert severity="error">Failed to create incident.</Alert>
          )}
          {createdRoomId && (
            <Alert severity="success">
              Incident created.{" "}
              <Button
                size="small"
                component={RouterLink}
                to={`/rooms/${createdRoomId}`}
              >
                View room
              </Button>
            </Alert>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
