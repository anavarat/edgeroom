import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import { Route, Routes } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import IncidentsPage from "./pages/IncidentsPage";
import NewIncidentPage from "./pages/NewIncidentPage";
import RoomPage from "./pages/RoomPage";
import "./App.css";


function App() {
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
    </>
  );
}

export default App
