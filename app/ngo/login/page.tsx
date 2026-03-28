"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PawPrint, Mail, Lock, ArrowRight, Loader2, AlertCircle,
  Clock, XCircle, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

type GateStatus = "idle" | "pending" | "rejected";

export default function NGOLoginPage() {
  const { user, role, loading: authLoading } = useAuth();

  // Auto-redirect if already logged in with an approved NGO role
  useEffect(() => {
    if (!authLoading && user && role === "ngo") {
      router.push("/ngo");
    }
    if (!authLoading && user && role === "admin") {
      router.push("/admin");
    }
  }, [user, role, authLoading]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gateStatus, setGateStatus] = useState<GateStatus>("idle");
  const [rejectionReason, setRejectionReason] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGateStatus("idle");

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) { setError("Authentication failed."); setLoading(false); return; }

    // 2. Call server-side status API (uses service role — bypasses RLS)
    //    This is the ONLY reliable way to read profiles + ngo_applications
    //    since those tables have restrictive RLS that blocks the anon client.
    let ngoStatus = "pending";
    let reason = "";

    try {
      const res = await fetch("/api/ngo/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      ngoStatus = data.status || "pending";
      reason = data.rejectionReason || "";
    } catch {
      // If API call fails, default to pending (safe)
    }

    if (ngoStatus === "admin") {
      router.push("/admin");
      return;
    }

    if (ngoStatus === "approved") {
      router.push("/ngo");
      return;
    }

    // Not yet approved — sign them out and show gate message
    await supabase.auth.signOut();

    if (ngoStatus === "rejected") {
      setRejectionReason(reason || "Your application did not meet requirements.");
      setGateStatus("rejected");
    } else {
      setGateStatus("pending");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-paw-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paw-green/15">
            <PawPrint className="h-6 w-6 text-paw-green" />
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

          {/* Gate status banners */}
          {gateStatus === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-paw-orange/30 bg-paw-orange/5 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-paw-orange" />
                <span className="text-sm font-semibold text-paw-orange">Application Under Review</span>
              </div>
              <p className="text-sm text-paw-muted">
                Your registration is being reviewed by our admin team. You will be able to sign in once approved (typically 24–48 hours).
              </p>
            </motion.div>
          )}

          {gateStatus === "rejected" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-paw-red/30 bg-paw-red/5 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-paw-red" />
                <span className="text-sm font-semibold text-paw-red">Application Rejected</span>
              </div>
              <p className="text-sm text-paw-muted">
                <strong className="text-paw-text">Reason:</strong> {rejectionReason}
              </p>
              <Link href="/ngo/register"
                className="mt-2 inline-block text-xs text-paw-orange hover:underline">
                Register a new application →
              </Link>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-paw-muted mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-paw-muted" />
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ngo-admin@care.org" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-paw-green/20 bg-paw-bg text-paw-text placeholder:text-paw-muted/50 focus:border-paw-green focus:outline-none transition-colors text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-paw-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-paw-muted" />
                <input type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-paw-green/20 bg-paw-bg text-paw-text placeholder:text-paw-muted/50 focus:border-paw-green focus:outline-none transition-colors text-sm" />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPwd
                    ? <EyeOff className="h-4 w-4 text-paw-muted" />
                    : <Eye className="h-4 w-4 text-paw-muted" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-paw-red/10 border border-paw-red/20 px-4 py-3 text-sm text-paw-red flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit"
              disabled={loading || !email || !password}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-green py-3 text-base font-semibold text-white transition-all hover:bg-paw-green/90 hover:shadow-lg hover:shadow-paw-green/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <>Launch Dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-paw-green/10 flex flex-col items-center gap-2 text-xs text-paw-muted">
            <span>
              New organisation?{" "}
              <Link href="/ngo/register" className="text-paw-orange hover:underline font-medium">
                Register your NGO →
              </Link>
            </span>
            <Link href="/" className="hover:text-paw-green transition-colors">
              Return to Public Portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
