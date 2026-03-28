import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { analyzeAnimalInjury } from "@/lib/gemini-triage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ngoId = searchParams.get("ngo_id");
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("reports")
    .select("*")
    .order("severity", { ascending: false });

  // Filter by assigned NGO if provided
  if (ngoId) {
    query = query.eq("assigned_ngo_id", ngoId);
  }

  // Filter by status if provided
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      species,
      description,
      lat,
      lng,
      location,
      image_url,
      // AI triage fields (from client if /api/triage was called first)
      severity: clientSeverity,
      severity_label: clientSeverityLabel,
      ai_description: clientAiDescription,
      injury_tags: clientInjuryTags,
    } = body;

    if (!species) {
      return NextResponse.json(
        { error: "Species is required" },
        { status: 400 }
      );
    }

    // Determine severity — use client-provided AI results, or run triage server-side
    let severity: number;
    let severityLabel: string;
    let aiDescription: string | null = null;
    let injuryTags: string[] | null = null;

    if (clientSeverity && clientSeverityLabel) {
      severity = clientSeverity;
      severityLabel = clientSeverityLabel;
      aiDescription = clientAiDescription || null;
      injuryTags = clientInjuryTags || null;
    } else if (image_url) {
      const triage = await analyzeAnimalInjury(image_url);
      severity = triage.severity;
      severityLabel = triage.severityLabel;
      aiDescription = triage.description;
      injuryTags = triage.tags;
    } else {
      severity = Math.floor(Math.random() * 8) + 2;
      const labels: Record<string, string> = {
        "9": "CRITICAL", "8": "CRITICAL", "7": "HIGH", "6": "HIGH",
        "5": "MODERATE", "4": "MODERATE", "3": "LOW", "2": "LOW",
      };
      severityLabel = labels[String(severity)] || "MODERATE";
    }

    const id = `PAW-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 9000) + 1000
    )}`;

    const report = {
      id,
      species,
      description: description || "",
      lat: lat || 28.6139,
      lng: lng || 77.209,
      location: location || "New Delhi",
      severity,
      severity_label: severityLabel,
      status: "pending",
      image_url: image_url || null,
      ai_description: aiDescription,
      injury_tags: injuryTags,
      assigned_ngo_id: null, // Not assigned until an NGO accepts
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
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
