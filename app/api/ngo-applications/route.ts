import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET all NGO applications (admin use)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ngo_applications")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create a new NGO application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id, email, phone,
      org_name, description, city, working_zone, address,
      pan_url, aadhaar_url, awbi_url,
    } = body;

    if (!user_id || !email || !org_name) {
      return NextResponse.json({ error: "user_id, email and org_name are required" }, { status: 400 });
    }

    const id = `NGO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const { data, error } = await supabaseAdmin
      .from("ngo_applications")
      .insert({
        id, user_id, email, phone,
        org_name, description, city, working_zone, address,
        pan_url: pan_url || null,
        aadhaar_url: aadhaar_url || null,
        awbi_url: awbi_url || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also upsert profile with role=ngo, ngo_status=pending
    await supabaseAdmin.from("profiles").upsert({
      id: user_id,
      role: "ngo",
      ngo_status: "pending",
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
