import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, ngoId, action, reason } = body;

    const appId = applicationId || ngoId;
    if (!appId || !action) {
      return NextResponse.json({ error: "applicationId and action are required" }, { status: 400 });
    }

    if (applicationId) {
      const now = new Date().toISOString();

      if (action === "approve") {
        // 1. Fetch user_id from the application
        const { data: app, error: fetchErr } = await supabaseAdmin
          .from("ngo_applications")
          .select("user_id")
          .eq("id", applicationId)
          .single();

        if (fetchErr || !app) {
          console.error("[VERIFY] Application not found:", fetchErr);
          return NextResponse.json({ error: "Application not found", detail: fetchErr?.message }, { status: 404 });
        }

        console.log("[VERIFY] Approving application:", applicationId, "user_id:", app.user_id);

        // 2. Update ngo_applications status
        const { error: updateAppErr } = await supabaseAdmin
          .from("ngo_applications")
          .update({ status: "approved", reviewed_at: now })
          .eq("id", applicationId);

        if (updateAppErr) {
          console.error("[VERIFY] Failed to update ngo_applications:", updateAppErr);
          return NextResponse.json({ error: "Failed to update application", detail: updateAppErr.message }, { status: 500 });
        }

        // 3. Upsert profile with approved status
        const { error: profileErr } = await supabaseAdmin
          .from("profiles")
          .upsert({ id: app.user_id, role: "ngo", ngo_status: "approved" });

        if (profileErr) {
          console.error("[VERIFY] Failed to update profile:", profileErr);
          return NextResponse.json({ error: "Failed to update profile", detail: profileErr.message }, { status: 500 });
        }

        console.log("[VERIFY] SUCCESS — application approved, profile updated");

      } else if (action === "reject") {
        // 1. Update application
        const { error: updateErr } = await supabaseAdmin
          .from("ngo_applications")
          .update({
            status: "rejected",
            rejection_reason: reason || "Application does not meet requirements.",
            reviewed_at: now,
          })
          .eq("id", applicationId);

        if (updateErr) {
          console.error("[VERIFY] Failed to reject application:", updateErr);
          return NextResponse.json({ error: "Rejection failed", detail: updateErr.message }, { status: 500 });
        }

        // 2. Fetch user_id to update profile
        const { data: app } = await supabaseAdmin
          .from("ngo_applications")
          .select("user_id")
          .eq("id", applicationId)
          .single();

        if (app) {
          const { error: profileErr } = await supabaseAdmin
            .from("profiles")
            .upsert({ id: app.user_id, role: "ngo", ngo_status: "rejected" });

          if (profileErr) {
            console.error("[VERIFY] Failed to update profile on reject:", profileErr);
          }
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
  } catch (err) {
    console.error("[VERIFY] Unhandled error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
