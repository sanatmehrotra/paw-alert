import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * ONE-TIME admin user seeding endpoint.
 * GET /api/setup-admin → creates admin@pawalert.in with password PawAdmin@2025
 * Delete this route after first use in production.
 */
export async function GET() {
  const ADMIN_EMAIL = "admin@pawalert.in";
  const ADMIN_PASSWORD = "PawAdmin@2025";

  try {
    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    if (existing) {
      // Update profile to admin role
      await supabaseAdmin.from("profiles").upsert({
        id: existing.id,
        role: "admin",
        ngo_status: null,
      });
      return NextResponse.json({
        message: "Admin user already exists. Profile updated to admin role.",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
    }

    // Create admin user via Supabase Auth Admin API
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // auto-confirm email
      user_metadata: { role: "admin" },
    });

    if (createErr) {
      console.error("[SETUP-ADMIN] Create user error:", createErr);
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }

    // Create admin profile
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: newUser.user.id,
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
