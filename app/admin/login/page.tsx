"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PawPrint, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError("Authentication failed.");
      setLoading(false);
      return;
    }

    // Verify admin role server-side
    try {
      const res = await fetch("/api/ngo/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (data.status === "admin") {
        router.push("/admin");
        return;
      }

      // Not admin — sign out and show error
      await supabase.auth.signOut();
      setError("This account does not have admin privileges.");
      setLoading(false);
    } catch {
      await supabase.auth.signOut();
      setError("Failed to verify admin access.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paw-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paw-orange/15 shadow-lg shadow-paw-orange/10">
            <PawPrint className="h-6 w-6 text-paw-orange" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Paw<span className="text-paw-orange">Admin</span>
          </span>
        </div>

        <div className="rounded-2xl border border-paw-orange/20 bg-paw-card p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Platform Control</h1>
            <p className="text-paw-muted text-sm italic">
              Authorized personnel only.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-paw-muted mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-paw-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@paw.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-paw-orange/20 bg-paw-bg text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-paw-muted mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-paw-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-paw-orange/20 bg-paw-bg text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg bg-paw-red/10 border border-paw-red/20 px-4 py-3 text-sm text-paw-red flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-3 text-base font-semibold text-white transition-all hover:bg-paw-orange/90 hover:shadow-xl hover:shadow-paw-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-paw-orange/10 text-center">
            <a href="/" className="text-xs text-paw-muted hover:text-paw-orange transition-colors">
              Return to Public Portal
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
