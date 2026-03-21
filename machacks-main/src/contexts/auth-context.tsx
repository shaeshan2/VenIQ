"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Demo credentials — shown in the sign-in modal for local / hackathon use. */
export const DEMO_USERNAME = "demo";
export const DEMO_PASSWORD = "demo123";

const STORAGE_KEY = "soundsmith_demo_auth";

export type AuthUser = { username: string };

export type LoginResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  /** False until localStorage has been read — avoids sign-in state flash on load. */
  isReady: boolean;
  login: (username: string, password: string) => LoginResult;
  logout: () => void;
  signInOpen: boolean;
  setSignInOpen: (open: boolean) => void;
  openSignIn: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed && typeof parsed.username === "string" && parsed.username.length > 0) {
          setUser({ username: parsed.username });
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setIsReady(true);
  }, []);

  const persist = useCallback((next: AuthUser | null) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    (username: string, password: string): LoginResult => {
      const u = username.trim();
      if (!u || !password) {
        return { ok: false, error: "Enter username and password." };
      }
      if (u === DEMO_USERNAME && password === DEMO_PASSWORD) {
        const next = { username: u };
        setUser(next);
        persist(next);
        return { ok: true, username: u };
      }
      return { ok: false, error: "Invalid username or password." };
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    persist(null);
  }, [persist]);

  const openSignIn = useCallback(() => setSignInOpen(true), []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      login,
      logout,
      signInOpen,
      setSignInOpen,
      openSignIn,
    }),
    [user, isReady, login, logout, signInOpen, openSignIn]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
