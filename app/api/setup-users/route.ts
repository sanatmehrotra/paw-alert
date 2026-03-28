import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * ONE-TIME seeding endpoint for system users.
 * GET /api/setup-users → creates admin@paw.com and ngo@paw.com
 */
export async function GET() {
  const usersToCreate = [
    { email: "admin@paw.com", password: "admin@paw.com", role: "admin", status: null },
    { email: "ngo@paw.com", password: "ngo@paw.com", role: "ngo", status: "approved" },
  ];

  const results = [];

  try {
    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();

    for (const u of usersToCreate) {
      let userId: string;
      const existing = existingUsers.find((existingUser: any) => existingUser.email === u.email);

      if (existing) {
        userId = existing.id;
        results.push({ email: u.email, status: "already_existed", userId });
      } else {
        // Create user
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { role: u.role },
        });

        if (createErr) {
          results.push({ email: u.email, status: "error_creating", error: createErr.message });
          continue;
        }
        userId = newUser.user.id;
        results.push({ email: u.email, status: "created", userId });
      }

      // Upsert profile
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        role: u.role,
        ngo_status: u.status,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seeding operation complete.",
      results,
    });
  } catch (err) {
    console.error("[SETUP-USERS] Error:", err);
    return NextResponse.json({ error: "Failed to seed users" }, { status: 500 });
  }
}
