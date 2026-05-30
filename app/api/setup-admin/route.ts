import { NextResponse } from "next/server";

/**
 * ⛔ DISABLED — Admin seeding endpoint has been locked down.
 * Admin accounts must be created directly via Supabase Dashboard.
 * https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
 */
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been disabled for security reasons." },
    { status: 403 }
  );
}
