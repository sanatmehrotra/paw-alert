import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { notifyDriverAssignment } from "@/lib/bot/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, ngoId } = body;

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    // Update report: set status to dispatched AND assign to this NGO
    const updatePayload: Record<string, unknown> = { status: "dispatched" };
    if (ngoId) {
      updatePayload.assigned_ngo_id = ngoId;
    }

    const { data, error } = await supabaseAdmin
      .from("reports")
      .update(updatePayload)
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Notify driver via Telegram if they have a linked chat ID (fire-and-forget)
    if (ngoId) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("telegram_chat_id")
          .eq("id", ngoId)
          .single();

        if (profile?.telegram_chat_id) {
          await notifyDriverAssignment({
            chatId: profile.telegram_chat_id,
            rescueId: data.id,
            species: data.species,
            severity: data.severity,
            severityLabel: data.severity_label,
            locationName: data.location,
            incidentLat: data.lat,
            incidentLng: data.lng,
          });
        }
      } catch (notifyErr) {
        console.error("[DISPATCH] Telegram notify failed (non-fatal):", notifyErr);
      }
    }

    // Return the driver link and tracker link
    const driverLink = `/driver?id=${encodeURIComponent(reportId)}`;
    const trackLink = `/track?id=${encodeURIComponent(reportId)}`;

    return NextResponse.json({
      success: true,
      report: data,
      driverLink,
      trackLink,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

