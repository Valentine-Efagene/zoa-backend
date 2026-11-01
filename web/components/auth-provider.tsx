"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getSession,
  signIn as authSignIn,
  signOut as authSignOut,
  subscribeSession,
  type AuthSession,
} from "@/lib/auth";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribe(listener: () => void) {
  return subscribeSession(listener);
}

function getClientSession(): AuthSession | null {
  return getSession();
}

function subscribeHydrated() {
  return () => {};
}
function getClientHydrated() {
  return true;
}
function getServerHydrated() {
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    subscribe,
    getClientSession,
    () => null,
  );
  const hydrated = useSyncExternalStore(
    subscribeHydrated,
    getClientHydrated,
    getServerHydrated,
  );
  const loading = !hydrated;

  const refresh = useCallback(() => {
    void getSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await authSignIn(email, password);
  }, []);

  const signOut = useCallback(() => {
    authSignOut();
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signOut, refresh }),
    [session, loading, signIn, signOut, refresh],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
