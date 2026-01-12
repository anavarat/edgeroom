import { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import AppHeader from "./components/AppHeader";
import "./App.css";


function App() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const r = await fetch("/api/health");
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }
        const data = await r.json();
        setHealth(data);
      } catch (e) {
        setHealth({ error: String(e) });
      }
    };
    
    loadHealth();
  }, []);

  return (
    <>
      <AppHeader />
      <Toolbar />
      <Container sx={{ py: 3 }}>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </Container>
    </>
  );
}

export default App
