"use client";

// ===== lib/session.tsx — sesión de usuario en localStorage =====
// Portado de la lógica de user/handleLogin/handleSignOut en references/templates/app.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type SessionUser = { name: string };

type SessionContextValue = {
  user: SessionUser | null;
  login: (u: SessionUser) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // El render inicial (SSR) siempre es null; se hidrata desde localStorage
  // en un efecto para evitar desajustes de hidratación.
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("av_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // localStorage deshabilitado (modo privado): la sesión no persiste.
    }
  }, []);

  const login = (u: SessionUser) => {
    setUser(u);
    try {
      localStorage.setItem("av_user", JSON.stringify(u));
    } catch {
      // no-op
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("av_user");
    } catch {
      // no-op
    }
  };

  return (
    <SessionContext.Provider value={{ user, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>");
  }
  return ctx;
}
