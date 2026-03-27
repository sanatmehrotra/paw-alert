"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: "admin" | "ngo" }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user -> redirect to specialized login
        router.push(requiredRole === "admin" ? "/admin/login" : "/ngo/login");
      } else if (requiredRole && role && role !== requiredRole) {
        // Wrong role -> redirect away
        router.push(role === "admin" ? "/admin" : "/ngo");
      }
    }
  }, [user, role, loading, router, requiredRole]);

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

  if (!user || (requiredRole && role !== requiredRole)) return null;

  return <>{children}</>;
}
