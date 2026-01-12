import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

export default function NewIncidentPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Create Incident</Typography>
      <Typography color="text.secondary">
        Form coming next.
      </Typography>
      <Button variant="outlined" onClick={() => navigate("/")}>
        Back to incidents
      </Button>
    </Stack>
  );
}
