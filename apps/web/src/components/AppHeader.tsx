import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { useIdentity } from "../hooks/useIdentity";

function getInitials(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase();
}

export default function AppHeader() {
  const { identity } = useIdentity();
  const displayName = identity?.displayName ?? "";
  const initials = displayName ? getInitials(displayName) : "?";

  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ textDecoration: "none", fontWeight: 600 }}
        >
          EdgeRoom
        </Typography>
        <Tooltip title={displayName || "Unknown"} arrow>
          <Avatar sx={{ ml: "auto", bgcolor: "primary.main" }}>{initials}</Avatar>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
