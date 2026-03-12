import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { ngoId, action } = await request.json();

    if (!ngoId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "ngoId and action (approve|reject) required" }, { status: 400 });
    }

    const ngo = store.updateNgoStatus(ngoId, action);
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json(ngo);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
