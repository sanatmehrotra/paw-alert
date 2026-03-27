import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, ngoId, action, reason } = body;

    // Support both old ngoId (ngos table) and new applicationId (ngo_applications)
    const appId = applicationId || ngoId;
    if (!appId || !action) {
      return NextResponse.json({ error: "applicationId and action are required" }, { status: 400 });
    }

    if (applicationId) {
      // New flow — ngo_applications table
      const now = new Date().toISOString();

      if (action === "approve") {
        const { data: app, error: fetchErr } = await supabaseAdmin
          .from("ngo_applications")
          .select("user_id")
          .eq("id", applicationId)
          .single();

        if (fetchErr || !app) {
          return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        await supabaseAdmin
          .from("ngo_applications")
          .update({ status: "approved", reviewed_at: now })
          .eq("id", applicationId);

        // Update profile so NGO can log in
        await supabaseAdmin
          .from("profiles")
          .upsert({ id: app.user_id, role: "ngo", ngo_status: "approved" });

      } else if (action === "reject") {
        await supabaseAdmin
          .from("ngo_applications")
          .update({
            status: "rejected",
            rejection_reason: reason || "Application does not meet requirements.",
            reviewed_at: now,
          })
          .eq("id", applicationId);

        // Fetch user_id to update profile
        const { data: app } = await supabaseAdmin
          .from("ngo_applications")
          .select("user_id")
          .eq("id", applicationId)
          .single();

        if (app) {
          await supabaseAdmin
            .from("profiles")
            .upsert({ id: app.user_id, role: "ngo", ngo_status: "rejected" });
        }
      }
    } else {
      // Legacy flow — old ngos table
      const statusMap: Record<string, string> = { approve: "Verified", reject: "Rejected" };
      const { error } = await supabaseAdmin
        .from("ngos")
        .update({ status: statusMap[action] || "Pending" })
        .eq("id", ngoId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
