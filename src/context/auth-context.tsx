// src/context/auth-context.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type AuthShape = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthShape | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return { error: new Error(error.message) };
    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = useMemo<AuthShape>(
    () => ({ user, session, loading, signInWithMagicLink, signOut }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Strict hook: requires provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Tolerant hook: won’t crash if provider missing (used by ScoringConfigPage)
export function useAuthOptional(): AuthShape {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  return {
    user: null,
    session: null,
    loading: false,
    signInWithMagicLink: async () => ({}),
    signOut: async () => {},
  };
}
