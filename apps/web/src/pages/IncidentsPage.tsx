import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useIncidents } from "../hooks/useIncidents";

export default function IncidentsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useIncidents();

  const incidents = useMemo(() => data?.incidents ?? [], [data?.incidents]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Incidents
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate("/incidents/new")}
        >
          Create Incident
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Incident Key</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Room</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>Loading incidents…</TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={4}>Failed to load incidents.</TableCell>
              </TableRow>
            )}
            {!isLoading && incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No incidents yet.</TableCell>
              </TableRow>
            )}
            {incidents.map((incident) => (
              <TableRow key={incident.incidentKey} hover>
                <TableCell>{incident.incidentKey}</TableCell>
                <TableCell>{incident.incidentCreatedAt}</TableCell>
                <TableCell>{incident.room.name}</TableCell>
                <TableCell align="right">
                  <Button onClick={() => navigate(`/rooms/${incident.room.id}`)}>
                    Join
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
