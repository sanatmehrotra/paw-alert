import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    const newStatus = action === "approve" ? "Verified" : "Rejected";

    const { data, error } = await supabaseAdmin
      .from("ngos")
      .update({ status: newStatus })
      .eq("id", ngoId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ngo: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
