import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    url: url ? `${url.substring(0, 10)}...` : "MISSING",
    key: key ? `${key.substring(0, 10)}...` : "MISSING",
    srv: srv ? `${srv.substring(0, 10)}...` : "MISSING",
    env: process.env.NODE_ENV,
  });
}
