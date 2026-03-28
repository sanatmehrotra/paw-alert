import { NextResponse } from "next/server";
import { analyzeAnimalInjury } from "@/lib/gemini-triage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image_url, species, description } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: "image_url is required" },
        { status: 400 }
      );
    }

    const result = await analyzeAnimalInjury(
      image_url,
      species || "Unknown",
      description || "",
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Triage analysis failed" },
      { status: 500 }
    );
  }
}
