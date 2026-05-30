import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * ONE-TIME admin user seeding endpoint.
 * Accepts ?email=...&password=... query params, or falls back to defaults.
 * GET /api/setup-admin?email=foo@bar.com&password=SecurePass123
 * ⚠️ Restrict or delete this route after use in production.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ADMIN_EMAIL = searchParams.get("email") || "admin@pawalert.in";
  const ADMIN_PASSWORD = searchParams.get("password") || "PawAdmin@2025";

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    if (existing) {
      // Update password + ensure profile is admin role
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: ADMIN_PASSWORD,
      });
      await supabaseAdmin.from("profiles").upsert({
        id: existing.id,
        email: ADMIN_EMAIL,
        role: "admin",
        ngo_status: null,
      });
      return NextResponse.json({
        message: "Admin user already existed — password updated, profile set to admin.",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        userId: existing.id,
      });
    }

    // Create brand-new admin user via Supabase Auth Admin API
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // auto-confirm — no email verification needed
      user_metadata: { role: "admin" },
    });

    if (createErr) {
      console.error("[SETUP-ADMIN] Create user error:", createErr);
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }

    // Create admin profile row
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: newUser.user.id,
      email: ADMIN_EMAIL,
      role: "admin",
      ngo_status: null,
    });

    if (profileErr) {
      console.error("[SETUP-ADMIN] Profile error:", profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully!",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      userId: newUser.user.id,
    });
  } catch (err) {
    console.error("[SETUP-ADMIN] Error:", err);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
