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

/** Demo credentials — demo log-in only. */
export const DEMO_USERNAME = "demo";
export const DEMO_PASSWORD = "demo123";

const STORAGE_KEY = "soundsmith_demo_auth";

export type AuthMode = "login" | "signup";

export type AuthUser = {
  username: string;
  email?: string;
};

export type AuthResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

export type AuthModalState = {
  open: boolean;
  mode: AuthMode;
};

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (username: string, password: string) => AuthResult;
  signUp: (email: string, password: string) => AuthResult;
  logout: () => void;
  authModal: AuthModalState;
  setAuthModal: React.Dispatch<React.SetStateAction<AuthModalState>>;
  openAuthModal: (mode: AuthMode) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const defaultModal: AuthModalState = { open: false, mode: "login" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [authModal, setAuthModal] = useState<AuthModalState>(defaultModal);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed && typeof parsed.username === "string" && parsed.username.length > 0) {
          setUser({
            username: parsed.username,
            email: typeof parsed.email === "string" ? parsed.email : undefined,
          });
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
    (username: string, password: string): AuthResult => {
      const u = username.trim();
      if (!u || !password) {
        return { ok: false, error: "Enter username and password." };
      }
      if (u === DEMO_USERNAME && password === DEMO_PASSWORD) {
        const next: AuthUser = { username: u };
        setUser(next);
        persist(next);
        return { ok: true, username: u };
      }
      return { ok: false, error: "Invalid username or password." };
    },
    [persist]
  );

  const signUp = useCallback(
    (email: string, password: string): AuthResult => {
      const e = email.trim();
      if (!e || !password) {
        return { ok: false, error: "Enter email and password." };
      }
      const at = e.indexOf("@");
      const local = at > 0 ? e.slice(0, at) : e;
      const next: AuthUser =
        at > 0
          ? { username: local || e, email: e }
          : { username: e };
      setUser(next);
      persist(next);
      return { ok: true, username: next.username };
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    persist(null);
  }, [persist]);

  const openAuthModal = useCallback((mode: AuthMode) => {
    setAuthModal({ open: true, mode });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      login,
      signUp,
      logout,
      authModal,
      setAuthModal,
      openAuthModal,
    }),
    [user, isReady, login, signUp, logout, authModal, openAuthModal]
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
