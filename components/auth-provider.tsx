"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetch user role using the server-side API (which uses service role key).
     * This bypasses RLS on the profiles table — the anon client cannot read it.
     * Always sets loading=false in finally so the dashboard never gets stuck.
     */
    const fetchRole = async (userId: string) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch("/api/ngo/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();
        if (data.status === "admin") {
          setRole("admin");
        } else if (data.status === "approved") {
          setRole("ngo");
        } else {
          setRole(null);
        }
      } catch {
        // Timeout or fetch failure — try direct query (may fail due to RLS)
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();
          if (!error && data) {
            setRole(data.role);
          } else {
            setRole(null);
          }
        } catch {
          setRole(null);
        }
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      try {
        if (session?.user) {
          await fetchRole(session.user.id);
        }
      } finally {
        setLoading(false); // Always clears loading — prevents stuck dashboard
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
