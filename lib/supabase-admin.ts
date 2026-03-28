import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Admin client (Service Role Key).
 * Should ONLY be imported in API routes and server actions.
 * Bypasses Row Level Security (RLS).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is missing! This is a severe internal error.");
}

export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseServiceKey || "internal-error-placeholder-key"
);
