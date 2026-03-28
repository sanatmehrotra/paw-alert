import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Server-side status check for NGO login gate + auth-provider role resolution.
 * Uses supabaseAdmin (service role) to bypass RLS.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    console.log("[NGO-STATUS] Checking status for user:", userId);

    // 1. Check profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("role, ngo_status")
      .eq("id", userId)
      .single();

    console.log("[NGO-STATUS] Profile query result:", { profile, error: profileErr?.message });

    if (profile?.role === "admin") {
      return NextResponse.json({ status: "admin" });
    }

    // 2. Check ngo_applications
    const { data: application, error: appErr } = await supabaseAdmin
      .from("ngo_applications")
      .select("status, rejection_reason")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    console.log("[NGO-STATUS] Application query result:", { application, error: appErr?.message });

    // Determine effective status
    const profileStatus = profile?.ngo_status;
    const appStatus = application?.status;
    const effectiveStatus = profileStatus || appStatus || "pending";

    console.log("[NGO-STATUS] Effective status:", effectiveStatus, "(profile:", profileStatus, "app:", appStatus, ")");

    return NextResponse.json({
      status: effectiveStatus,
      rejectionReason: application?.rejection_reason || null,
    });
  } catch (err) {
    console.error("[NGO-STATUS] Unhandled error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
