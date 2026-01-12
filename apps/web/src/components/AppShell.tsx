import * as React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import { useIdentity } from "../hooks/useIdentity";
import { useTriggerIncident } from "../hooks/useIncidents";


const DRAWER_WIDTH = 240;

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { identity } = useIdentity();
  const displayName = identity?.displayName ?? "";
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const triggerIncident = useTriggerIncident();
  const [demoNotice, setDemoNotice] = React.useState<string | null>(null);
  const [demoError, setDemoError] = React.useState<string | null>(null);

  const navItems = [
    { label: "Dashboard", to: "/", icon: <DashboardIcon /> },
    { label: "Create Incident", to: "/incidents/new", icon: <AddIcon /> },
    { label: "Generate Demo Incident", to: "/incidents/new", icon: <AutoAwesomeIcon />, action: "demo" as const },
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
              component={item.action ? "button" : RouterLink}
              to={item.action ? undefined : item.to}
              selected={selected}
              sx={{ borderRadius: 1 }}
              onClick={async () => {
                if (item.action !== "demo") return;
                if (!identity) return;
                const demoIncidents = [
                  {
                    incidentKey: `pd:INC-${Math.floor(Math.random() * 900000 + 100000)}`,
                    roomName: "Payments latency spike",
                    initialEvent: {
                      type: "status" as const,
                      message: "Payment processor p95 jumped to 4.2s; investigating upstream gateway.",
                    },
                  },
                  {
                    incidentKey: `pd:INC-${Math.floor(Math.random() * 900000 + 100000)}`,
                    roomName: "Checkout errors 500",
                    initialEvent: {
                      type: "status" as const,
                      message: "Error rate 5xx at 18% on /checkout. Rolling back last deploy.",
                    },
                  },
                  {
                    incidentKey: `pd:INC-${Math.floor(Math.random() * 900000 + 100000)}`,
                    roomName: "DB connection pool exhausted",
                    initialEvent: {
                      type: "note" as const,
                      message: "Primary DB pool saturation. Throttling background jobs.",
                    },
                  },
                  {
                    incidentKey: `pd:INC-${Math.floor(Math.random() * 900000 + 100000)}`,
                    roomName: "Login failures",
                    initialEvent: {
                      type: "status" as const,
                      message: "Auth provider elevated timeouts. Failures at 12%.",
                    },
                  },
                  {
                    incidentKey: `pd:INC-${Math.floor(Math.random() * 900000 + 100000)}`,
                    roomName: "CDN cache miss surge",
                    initialEvent: {
                      type: "note" as const,
                      message: "Cache hit ratio dropped to 42%. Suspect config push.",
                    },
                  },
                ];
                const pick = demoIncidents[Math.floor(Math.random() * demoIncidents.length)];
                try {
                  await triggerIncident.mutateAsync({
                  incidentKey: pick.incidentKey,
                  roomName: pick.roomName,
                  initialEvent: {
                    ...pick.initialEvent,
                    createdBy: identity,
                  },
                  });
                  setDemoNotice(`Demo incident created: ${pick.roomName}`);
                } catch (err) {
                  setDemoError("Failed to create demo incident.");
                }
              }}
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
      <Snackbar
        open={Boolean(demoNotice)}
        autoHideDuration={4000}
        onClose={() => setDemoNotice(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setDemoNotice(null)}>
          {demoNotice}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(demoError)}
        autoHideDuration={4000}
        onClose={() => setDemoError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setDemoError(null)}>
          {demoError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
