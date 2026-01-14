// edgeroom/apps/web/src/pages/IncidentsPage.tsx
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableContainer from "@mui/material/TableContainer";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Typography from "@mui/material/Typography";

import { useIncidents } from "../hooks/useIncidents";

export default function IncidentsPage() {
  const { data, isLoading, error } = useIncidents();

  const incidents = useMemo(() => data?.incidents ?? [], [data?.incidents]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <Typography variant="h4" sx={{ flexGrow: 1 }} >
          Incidents Dashboard
        </Typography>
      </Stack>
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600, overflow: "auto" }}>
          <Table size="small" stickyHeader aria-label="incidents table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper" }}>
                  Incident Key
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper" }}>
                  Created At
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper" }}>
                  Room
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, bgcolor: "background.paper" }}
                >
                  Actions
                </TableCell>
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
                  <TableCell sx={{ fontFamily: "monospace" }}>
                    <Button
                      component={RouterLink}
                      to={`/incidents/${incident.incidentKey}`}
                      sx={{ textTransform: "none", fontFamily: "monospace" }}
                    >
                      {incident.incidentKey}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {new Date(incident.incidentCreatedAt).toLocaleString()}
                  </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">{incident.room.name}</Typography>
                    {incident.status === "resolved" && (
                      <Chip size="small" label="Resolved" color="success" />
                    )}
                  </Stack>
                </TableCell>
                  <TableCell align="right">
                    <Button component={RouterLink} to={`/rooms/${incident.room.id}`}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
