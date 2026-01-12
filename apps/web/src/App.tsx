// edgeroom/apps/web/src/App.tsx
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import { Route, Routes } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import IdentityPrompt from "./components/IdentityPrompt";
import { useIdentity } from "./hooks/useIdentity";
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
      <AppHeader />
      <Toolbar />
      <Container sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<IncidentsPage />} />
          <Route path="/incidents/new" element={<NewIncidentPage />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
        </Routes>
      </Container>
      <IdentityPrompt open={identityPromptOpen} />
    </>
  );
}

export default App
