import * as React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";

import { useIdentity } from "../hooks/useIdentity";


const DRAWER_WIDTH = 240;

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { identity } = useIdentity();
  const displayName = identity?.displayName ?? "";
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { label: "Dashboard", to: "/", icon: <DashboardIcon /> },
    { label: "Create Incident", to: "/incidents/new", icon: <AddIcon /> },
  ];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar>
        <Typography variant="h5" noWrap>
          EdgeRoom
        </Typography>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          minHeight: 56, // keeps row height consistent
        }}
      >
        <Typography variant="body2" color="text.secondary" noWrap>
          Welcome{displayName ? `, ${displayName}` : ""}
        </Typography>
      </Box>
    </Box>
  );

  const isRoomRoute = location.pathname.startsWith("/rooms/");

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* LEFT DRAWER */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isRoomRoute ? 1.5 : 3,
          minWidth: 0,
          backgroundColor: (t) => t.palette.background.default,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Optional max width so it doesn't feel lost on ultrawide */}
        <Box
          sx={{
            maxWidth: isRoomRoute ? "none" : { xs: "100%", lg: 1500 },
            mx: isRoomRoute ? 0 : "auto",
            flexGrow: 1,
            minHeight: 0,
            width: "100%",
            height: "100%",
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
