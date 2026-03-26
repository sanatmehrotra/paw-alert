import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, driverId } = body;

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    // Mock dispatch logic
    const report = store.updateReportStatus(reportId, "dispatched");
    
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Dispatched driver ${driverId || 'closest available'} to report ${reportId}`,
      report 
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
