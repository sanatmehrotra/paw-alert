import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .order("severity", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { species, description, lat, lng, location } = body;

    if (!species) {
      return NextResponse.json({ error: "Species is required" }, { status: 400 });
    }

    const severity = Math.floor(Math.random() * 8) + 2; // 2-9
    const labels: Record<string, string> = {
      "9": "CRITICAL", "8": "CRITICAL", "7": "HIGH", "6": "HIGH",
      "5": "MODERATE", "4": "MODERATE", "3": "LOW", "2": "LOW"
    };

    const id = `PAW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const report = {
      id,
      species,
      description: description || "",
      lat: lat || 28.6139,
      lng: lng || 77.209,
      location: location || "New Delhi",
      severity,
      severity_label: labels[String(severity)] || "MODERATE",
      status: "pending",
    };

    const { data, error } = await supabaseAdmin
      .from("reports")
      .insert(report)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
