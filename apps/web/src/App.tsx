// edgeroom/apps/web/src/App.tsx
import { Route, Routes } from "react-router-dom";
import { Toolbar } from "@mui/material";
import { AppShell } from "./components/AppShell";
import IdentityPrompt from "./components/IdentityPrompt";
import { useIdentity } from "./hooks/useIdentity";
import IncidentDetailPage from "./pages/IncidentDetailPage";
import IncidentsPage from "./pages/IncidentsPage";
import NewIncidentPage from "./pages/NewIncidentPage";
import RoomPage from "./pages/RoomPage";
import "./App.css";

function App() {
  const { identity, loaded } = useIdentity();
  const identityPromptOpen =
    loaded && (!identity || identity.displayName === "Guest");

  return (
    <>
      <AppShell>
        {/* <Toolbar /> */}
        <Routes>
          <Route path="/" element={<IncidentsPage />} />
          <Route path="/incidents/new" element={<NewIncidentPage />} />
          <Route path="/incidents/:incidentKey" element={<IncidentDetailPage />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
        </Routes>
      </AppShell>

      <IdentityPrompt open={identityPromptOpen} />
    </>
  );
}

export default App;
