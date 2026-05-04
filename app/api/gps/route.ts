import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/gps
 * Driver posts their live GPS position.
 * Persists lat/lng to the report row so NGO map can load last known position on refresh.
 */
export async function POST(request: Request) {
  try {
    const { reportId, lat, lng, speed, heading, accuracy } = await request.json();

    if (!reportId || lat == null || lng == null) {
      return NextResponse.json({ error: "reportId, lat, lng required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("reports")
      .update({
        van_lat: lat,
        van_lng: lng,
        van_speed: speed ?? null,
        van_heading: heading ?? null,
        van_accuracy: accuracy ?? null,
        van_updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      console.error("[GPS] DB update error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[GPS] Error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
