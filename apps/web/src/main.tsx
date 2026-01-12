import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IdentityProvider } from "./hooks/useIdentity";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </IdentityProvider>
    </QueryClientProvider>
  </StrictMode>,
)
