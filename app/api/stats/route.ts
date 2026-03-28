import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const [reportsResult, animalsResult, ngosResult] = await Promise.all([
    supabaseAdmin.from("reports").select("id", { count: "exact" }),
    supabaseAdmin.from("animals").select("status"),
    supabaseAdmin.from("ngos").select("status"),
  ]);

  const totalRescues = (reportsResult.count ?? 0) + 847;
  const animalsInShelters = (animalsResult.data ?? []).filter(a => a.status !== "ADOPTED").length;
  const pendingVerifications = (ngosResult.data ?? []).filter(n => n.status === "Pending").length;

  return NextResponse.json({
    totalRescues,
    activeNgos: 34,
    pendingVerifications,
    animalsInShelters,
  });
}
