import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json(store.getReports());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { species, description, lat, lng, location } = body;

    if (!species) {
      return NextResponse.json({ error: "Species is required" }, { status: 400 });
    }

    const report = store.addReport({
      species,
      description: description || "",
      lat: lat || 28.6139,
      lng: lng || 77.209,
      location,
    });

    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
