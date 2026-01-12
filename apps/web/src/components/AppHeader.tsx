import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

export default function AppHeader() {
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
      </Toolbar>
    </AppBar>
  );
}
