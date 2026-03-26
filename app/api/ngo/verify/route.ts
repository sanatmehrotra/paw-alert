import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ngoId, action } = body;

    if (!ngoId || !action) {
      return NextResponse.json({ error: "ngoId and action are required" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedNgo = store.updateNgoStatus(ngoId, action);
    
    if (!updatedNgo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ngo: updatedNgo });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
