import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
