"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "admin" | "ngo";
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No session → redirect to appropriate login
        router.push(requiredRole === "admin" ? "/admin/login" : "/ngo/login");
      } else if (requiredRole && role && role !== requiredRole) {
        // Authenticated but wrong role → send to their correct dashboard
        router.push(role === "admin" ? "/admin" : "/ngo");
      }
    }
  }, [user, role, loading, router, requiredRole]);

  // Still loading session / role
  if (loading) {
    return (
      <div className="min-h-screen bg-paw-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-paw-orange" />
          <p className="text-sm text-paw-muted">Verifying session...</p>
        </div>
      </div>
    );
  }

  // No user at all → useEffect will redirect; show spinner while navigating
  if (!user) {
    return (
      <div className="min-h-screen bg-paw-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-paw-orange" />
      </div>
    );
  }

  // User exists but role could not be resolved (e.g. pending approval / rejected / network error)
  if (requiredRole && role !== requiredRole) {
    // If role is the other valid role, useEffect handles redirect — show spinner
    if (role === "admin" || role === "ngo") {
      return (
        <div className="min-h-screen bg-paw-bg flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-paw-orange" />
        </div>
      );
    }

    // Role is null — account exists but is pending / rejected / no NGO registration
    return (
      <div className="min-h-screen bg-paw-bg flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl border border-paw-orange/20 bg-paw-card p-8 text-center shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paw-orange/10 mx-auto mb-4">
            <ShieldAlert className="h-7 w-7 text-paw-orange" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Pending</h2>
          <p className="text-sm text-paw-muted mb-6">
            Your account is registered but your NGO application is still under review, or you haven&apos;t applied yet.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/ngo/register"
              className="w-full rounded-xl bg-paw-orange py-2.5 text-sm font-semibold text-white transition-all hover:bg-paw-orange/90"
            >
              Register your NGO →
            </Link>
            <Link
              href="/ngo/login"
              className="w-full rounded-xl border border-paw-orange/20 py-2.5 text-sm font-medium text-paw-muted transition-all hover:text-paw-text"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
