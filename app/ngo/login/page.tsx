"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PawPrint, Mail, Lock, ArrowRight, Loader2, AlertCircle, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NGOLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/ngo");
    }
  };

  return (
    <div className="min-h-screen bg-paw-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paw-green/15">
            <Heart className="h-6 w-6 text-paw-green" />
          </div>
          <span className="text-2xl font-bold">
            Paw<span className="text-paw-green">Rescue</span>
          </span>
        </div>

        <div className="rounded-2xl border border-paw-green/20 bg-paw-card p-8 shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">NGO Portal</h1>
            <p className="text-paw-muted text-sm">
              Sign in to manage active rescue missions.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-paw-muted mb-2">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-paw-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ngo-admin@care.org"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-paw-green/20 bg-paw-bg text-paw-text placeholder:text-paw-muted/50 focus:border-paw-green focus:outline-none transition-colors"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-paw-green/20 bg-paw-bg text-paw-text placeholder:text-paw-muted/50 focus:border-paw-green focus:outline-none transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-paw-red/10 border border-paw-red/20 px-4 py-3 text-sm text-paw-red flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-green py-3 text-base font-semibold text-white transition-all hover:bg-paw-green/90 hover:shadow-lg hover:shadow-paw-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Launch Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-paw-green/10 text-center">
            <a href="/" className="text-xs text-paw-muted hover:text-paw-green transition-colors">
              Return to Public Portal
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
