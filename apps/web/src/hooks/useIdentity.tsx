import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserIdentity = { userId: string; displayName: string };

type IdentityContextValue = {
  identity: UserIdentity | null;
  setIdentity: (identity: UserIdentity | null) => void;
};

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

function loadIdentity(): UserIdentity | null {
  const userId = localStorage.getItem("edgeroom.userId");
  const displayName = localStorage.getItem("edgeroom.displayName");
  if (!userId || !displayName) return null;
  return { userId, displayName };
}

function persistIdentity(identity: UserIdentity | null) {
  if (!identity) {
    localStorage.removeItem("edgeroom.userId");
    localStorage.removeItem("edgeroom.displayName");
    return;
  }
  localStorage.setItem("edgeroom.userId", identity.userId);
  localStorage.setItem("edgeroom.displayName", identity.displayName);
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentityState] = useState<UserIdentity | null>(null);

  useEffect(() => {
    setIdentityState(loadIdentity());
  }, []);

  const setIdentity = (next: UserIdentity | null) => {
    setIdentityState(next);
    persistIdentity(next);
  };

  const value = useMemo(() => ({ identity, setIdentity }), [identity]);

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error("useIdentity must be used within IdentityProvider");
  }
  return ctx;
}
