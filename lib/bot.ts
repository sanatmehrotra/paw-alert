// =============================================================
// PawAlert Telegram Bot — Main bot instance
// Single grammY Bot shared across all webhook invocations
// =============================================================

import { Bot, session } from "grammy";
import type { SessionData, BotContext } from "./bot/types";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { notifyDriverAssignment, sendMessage } from "./bot/notifications";
import { analyzeAnimalInjury } from "@/lib/gemini-triage";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

if (!TOKEN) {
  console.warn("[BOT] TELEGRAM_BOT_TOKEN not set. Bot will not respond.");
}

// ─────────────────────────────────────────────────────────────
// Bot instance
// ─────────────────────────────────────────────────────────────
export const bot = new Bot<BotContext>(TOKEN || "placeholder_token");

// ─────────────────────────────────────────────────────────────
// Session middleware (in-memory — fine for this scale)
// ─────────────────────────────────────────────────────────────
function initialSession(): SessionData {
  return { step: "idle" };
}

bot.use(session({ initial: initialSession }));

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const SPECIES_OPTIONS = ["Dog", "Cat", "Cow", "Bird", "Other"];
const speciesEmoji: Record<string, string> = {
  Dog: "🐕", Cat: "🐈", Cow: "🐄", Bird: "🦅", Other: "🐾",
};

async function lookupProfile(email: string) {
  // Look up auth.users by email, then profiles for role
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const user = users?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, ngo_status, telegram_chat_id")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, userId: user.id, email: user.email } : null;
}

async function saveTelegramChatId(userId: string, chatId: number) {
  await supabaseAdmin
    .from("profiles")
    .update({ telegram_chat_id: chatId })
    .eq("id", userId);
}

async function getProfileByChatId(chatId: number) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role, ngo_status, telegram_chat_id")
    .eq("telegram_chat_id", chatId)
    .single();
  return data;
}

function generateRescueId() {
  return `PAW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

/** Verify password via Supabase Auth REST API (stateless, no session created) */
async function verifyPassword(email: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        },
        body: JSON.stringify({ email, password }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Parse a rescue ID from a URL or raw ID string */
function parseRescueId(input: string): string | null {
  // URL format: /driver?id=XXX or /track?id=XXX
  const urlMatch = input.match(/[?&]id=([A-Z0-9-]+)/i);
  if (urlMatch) return urlMatch[1].toUpperCase();
  // Raw ID: PAW-2026-1234
  const idMatch = input.match(/PAW-\d{4}-\d{3,4}/i);
  if (idMatch) return idMatch[0].toUpperCase();
  return null;
}

// ─────────────────────────────────────────────────────────────
// /start command
// ─────────────────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  const chatId = ctx.chat.id;
  const profile = await getProfileByChatId(chatId);

  if (profile) {
    const roleLabel = profile.role === "admin" ? "Admin 🔐" : "NGO / Driver 🚐";
    ctx.session = { step: "idle", linkedChatId: chatId, linkedRole: profile.role };
    await ctx.reply(
      `👋 Welcome back! Your account is linked as <b>${roleLabel}</b>.\n\nSend /help to see your commands, or /logout to unlink.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  ctx.session = { step: "awaiting_role" };
  await ctx.reply(
    `🐾 <b>Welcome to PawAlert!</b>\n\nI help rescue injured street animals across India.\n\n` +
    `📸 <b>Want to report an animal?</b> Just send /report — no account needed!\n\n` +
    `To link a professional account, select your role:`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏢 NGO Coordinator", callback_data: "role:ngo" },
            { text: "🚗 Driver", callback_data: "role:driver" },
          ],
          [
            { text: "🔐 Admin", callback_data: "role:admin" },
          ],
        ],
      },
    }
  );
});

// ─────────────────────────────────────────────────────────────
// /help command
// ─────────────────────────────────────────────────────────────
bot.command("help", async (ctx) => {
  const profile = await getProfileByChatId(ctx.chat.id);
  const isNgo = profile?.role === "ngo";
  const isAdmin = profile?.role === "admin";

  let text = `🐾 <b>PawAlert Commands</b>\n\n`;
  if (!profile) {
    text += `<b>Anyone (no login needed):</b>\n`;
    text += `/report — Report an injured animal 📸\n`;
    text += `/status — Check rescue status by ID 🔍\n\n`;
    text += `<b>Professional accounts:</b>\n`;
    text += `/start — Link your NGO / Driver / Admin account`;
  } else if (isAdmin) {
    text += `<b>Admin Commands:</b>\n`;
    text += `/report — Report an animal 📸\n`;
    text += `/status — Check rescue status 🔍\n`;
    text += `/logout — Unlink this account 🔓\n\n`;
    text += `ℹ️ NGO approval/rejection alerts arrive automatically.`;
  } else if (isNgo) {
    text += `<b>NGO / Driver Commands:</b>\n`;
    text += `/track — Accept a rescue by ID or link 🚗\n`;
    text += `/myrescues — View active missions 🚐\n`;
    text += `/report — Report an animal 📸\n`;
    text += `/status — Check rescue status 🔍\n`;
    text += `/logout — Unlink this account 🔓\n\n`;
    text += `ℹ️ Dispatch alerts arrive automatically. Share your <b>Live Location</b> during a rescue to enable citizen tracking.`;
  }

  await ctx.reply(text, { parse_mode: "HTML" });
});

// ─────────────────────────────────────────────────────────────
// /logout command — unlinks Telegram chat from Supabase profile
// ─────────────────────────────────────────────────────────────
bot.command("logout", async (ctx) => {
  const chatId = ctx.chat.id;
  const profile = await getProfileByChatId(chatId);

  if (!profile) {
    ctx.session = { step: "idle" };
    await ctx.reply(
      "No account is currently linked to this chat.\n\nSend /start to link an NGO/Admin account, or /report to report an animal."
    );
    return;
  }

  try {
    // Remove telegram_chat_id from profiles table
    await supabaseAdmin
      .from("profiles")
      .update({ telegram_chat_id: null })
      .eq("telegram_chat_id", chatId);

    // Clear all session state
    ctx.session = { step: "idle" };

    await ctx.reply(
      "🔓 <b>Logged out successfully.</b>\n\nYour Telegram account has been unlinked from PawAlert.\n\nSend /start to link a different account, or /report to report an animal without an account.",
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("[BOT] Logout error:", err);
    await ctx.reply("Something went wrong during logout. Please try again.");
  }
});

// ─────────────────────────────────────────────────────────────
// /track command — drivers accept a rescue by link or ID
// ─────────────────────────────────────────────────────────────
bot.command("track", async (ctx) => {
  const profile = await getProfileByChatId(ctx.chat.id);
  if (!profile || profile.role !== "ngo") {
    await ctx.reply(
      "⚠️ This command is for linked NGO/Driver accounts.\n\nSend /start to link your account first."
    );
    return;
  }

  // Check if ID was passed as argument: /track PAW-2026-1234
  const args = (ctx.message?.text || "").split(/\s+/).slice(1).join(" ").trim();
  if (args) {
    const rescueId = parseRescueId(args);
    if (rescueId) {
      await handleAcceptRescue(ctx, rescueId);
      return;
    }
  }

  ctx.session.step = "track_awaiting_id";
  await ctx.reply(
    `🔗 <b>Accept a Rescue</b>\n\nPaste the driver link or rescue ID sent by your NGO coordinator:\n\n` +
    `<i>Examples:</i>\n` +
    `<code>PAW-2026-4823</code>\n` +
    `<code>https://paw-alert.onrender.com/driver?id=PAW-2026-4823</code>`,
    { parse_mode: "HTML" }
  );
});

// ─────────────────────────────────────────────────────────────
// /report command — open to everyone, no account needed
// ─────────────────────────────────────────────────────────────
bot.command("report", async (ctx) => {
  ctx.session.step = "report_awaiting_photo";
  await ctx.reply(
    "📸 <b>Step 1/4 — Photo</b>\n\nPlease send a clear photo of the injured animal.\n\n<i>No account needed — anyone can report!</i>",
    { parse_mode: "HTML" }
  );
});

// ─────────────────────────────────────────────────────────────
// /status command — open to everyone, lookup by Rescue ID
// ─────────────────────────────────────────────────────────────
bot.command("status", async (ctx) => {
  ctx.session.step = "status_awaiting_id";
  await ctx.reply(
    "🔍 Enter your <b>Rescue ID</b> to check status:\n\n<i>Example: <code>PAW-2026-4823</code></i>\n\nYou received this ID when you submitted your report.",
    { parse_mode: "HTML" }
  );
});

// ─────────────────────────────────────────────────────────────
// /myrescues — for drivers
// ─────────────────────────────────────────────────────────────
bot.command("myrescues", async (ctx) => {
  const profile = await getProfileByChatId(ctx.chat.id);
  if (!profile || profile.role !== "ngo") {
    await ctx.reply("⚠️ This command is only available for NGO drivers.");
    return;
  }

  // Find reports dispatched to this NGO (by chat_id → user_id link)
  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", ctx.chat.id)
    .single();

  if (!myProfile) {
    await ctx.reply("Could not find your profile. Please /start again.");
    return;
  }

  const { data: missions } = await supabaseAdmin
    .from("reports")
    .select("id, species, location, severity, status, created_at")
    .eq("assigned_ngo_id", myProfile.id)
    .eq("status", "dispatched")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!missions || missions.length === 0) {
    await ctx.reply("✅ No active missions assigned to you today.");
    return;
  }

  const lines = missions.map((m) => {
    const emoji = speciesEmoji[m.species] || "🐾";
    return `${emoji} <code>${m.id}</code>\n   ${m.species} at ${m.location}\n   Severity: ${m.severity}/10`;
  });

  await ctx.reply(`🚐 <b>Your Active Missions</b>\n\n${lines.join("\n\n")}`, {
    parse_mode: "HTML",
  });
});

// ─────────────────────────────────────────────────────────────
// Callback query handler (inline buttons)
// ─────────────────────────────────────────────────────────────
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  // ── Role selection ──────────────────────────────────────────
  if (data.startsWith("role:")) {
    const role = data.split(":")[1] as "ngo" | "driver" | "admin";
    ctx.session.selectedRole = role;
    ctx.session.step = "awaiting_email";
    const labels: Record<string, string> = { ngo: "NGO Coordinator", driver: "Driver", admin: "Admin" };
    await ctx.reply(
      `👤 <b>${labels[role]}</b> selected.\n\nPlease enter your registered PawAlert email address:`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // ── Species selection during report ────────────────────────
  if (data.startsWith("species:")) {
    const species = data.split(":")[1];
    ctx.session.reportSpecies = species;
    ctx.session.step = "report_awaiting_location";
    await ctx.reply(
      `🐾 <b>${speciesEmoji[species] || ""} ${species}</b> selected.\n\n📍 <b>Step 3/4 — Location</b>\n\nPlease share your location so we can send the nearest rescue van:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [[{ text: "📍 Share Location", request_location: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
    return;
  }

  // ── Report confirm ──────────────────────────────────────────
  if (data === "confirm_report") {
    await handleConfirmReport(ctx);
    return;
  }

  if (data === "cancel_report") {
    ctx.session.step = "idle";
    await ctx.reply("❌ Report cancelled. Send /report to start again.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  // ── Driver: Accept / Decline rescue ────────────────────────
  if (data.startsWith("accept_rescue:")) {
    const rescueId = data.split(":")[1];
    await handleAcceptRescue(ctx, rescueId);
    return;
  }

  if (data.startsWith("decline_rescue:")) {
    const rescueId = data.split(":")[1];
    await handleDeclineRescue(ctx, rescueId);
    return;
  }

  // ── Driver: Stage updates ───────────────────────────────────
  if (data.startsWith("stage:")) {
    const [, rescueId, stage] = data.split(":");
    await handleStageUpdate(ctx, rescueId, stage);
    return;
  }

  // ── Admin: Approve / Reject NGO ────────────────────────────
  if (data.startsWith("approve_ngo:")) {
    const appId = data.split(":")[1];
    await handleApproveNgo(ctx, appId);
    return;
  }

  if (data.startsWith("reject_ngo:")) {
    const appId = data.split(":")[1];
    ctx.session.step = "admin_awaiting_rejection_reason";
    ctx.session.pendingRejectAppId = appId;
    await ctx.reply(
      "📝 Please type the reason for rejection (will be sent to the NGO):"
    );
    return;
  }
});

// ─────────────────────────────────────────────────────────────
// Photo handler
// ─────────────────────────────────────────────────────────────
bot.on("message:photo", async (ctx) => {
  if (ctx.session.step !== "report_awaiting_photo") return;

  const photo = ctx.message.photo;
  const largest = photo[photo.length - 1];
  ctx.session.reportPhotoFileId = largest.file_id;
  ctx.session.step = "report_awaiting_species";

  await ctx.reply(
    "✅ Photo received!\n\n🐾 <b>Step 2/4 — Species</b>\n\nWhat animal is this?",
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          SPECIES_OPTIONS.map((s) => ({
            text: `${speciesEmoji[s]} ${s}`,
            callback_data: `species:${s}`,
          })),
        ],
      },
    }
  );
});

// ─────────────────────────────────────────────────────────────
// Location handler
// ─────────────────────────────────────────────────────────────
bot.on("message:location", async (ctx) => {
  if (ctx.session.step !== "report_awaiting_location") return;

  const { latitude, longitude } = ctx.message.location;
  ctx.session.reportLat = latitude;
  ctx.session.reportLng = longitude;
  ctx.session.step = "report_awaiting_confirm";

  const species = ctx.session.reportSpecies || "Unknown";
  const emoji = speciesEmoji[species] || "🐾";

  await ctx.reply(
    `📋 <b>Step 4/4 — Confirm Report</b>\n\n` +
    `${emoji} Animal: <b>${species}</b>\n` +
    `📍 Location: <b>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</b>\n\n` +
    `Submit this rescue report?`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Confirm", callback_data: "confirm_report" },
          { text: "❌ Cancel", callback_data: "cancel_report" },
        ]],
        remove_keyboard: true,
      },
    }
  );
});

// ─────────────────────────────────────────────────────────────
// Text message handler (multi-step flows)
// ─────────────────────────────────────────────────────────────
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  // ── Auto-detect driver links pasted in chat ─────────────────
  if (ctx.session.step === "idle" || !ctx.session.step) {
    const rescueId = parseRescueId(text);
    if (rescueId && text.includes("driver")) {
      const profile = await getProfileByChatId(ctx.chat.id);
      if (profile?.role === "ngo") {
        await ctx.reply(`🔍 Detected rescue <code>${rescueId}</code> from link. Accepting...`, { parse_mode: "HTML" });
        await handleAcceptRescue(ctx, rescueId);
        return;
      }
    }
  }

  // ── Account linking — Step 1: Email lookup ──────────────────
  if (ctx.session.step === "awaiting_email") {
    const email = text.toLowerCase();
    await ctx.reply("🔍 Looking up your account...");

    try {
      const profile = await lookupProfile(email);

      if (!profile) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com";
        await ctx.reply(
          `❌ No account found for <b>${email}</b>.\n\n` +
          `Please register at:\n<a href="${appUrl}/ngo/register">${appUrl}/ngo/register</a>\n\n` +
          `Once approved, come back and send /start to link.`,
          { parse_mode: "HTML" }
        );
        ctx.session.step = "idle";
        return;
      }

      // Verify role compatibility
      const selectedRole = ctx.session.selectedRole;
      const roleMatches =
        (selectedRole === "admin" && profile.role === "admin") ||
        (selectedRole === "ngo" && profile.role === "ngo") ||
        (selectedRole === "driver" && profile.role === "ngo"); // drivers are ngo role in DB

      if (!roleMatches) {
        const hint = profile.role === "admin" ? "Admin" : profile.role === "ngo" ? "NGO/Driver" : profile.role;
        await ctx.reply(
          `⚠️ Role mismatch. Your account is registered as <b>${hint}</b>.\n\nSend /start and select the correct role.`,
          { parse_mode: "HTML" }
        );
        ctx.session.step = "idle";
        return;
      }

      // Store email + userId, ask for password
      ctx.session.authEmail = email;
      ctx.session.authUserId = profile.userId;
      ctx.session.step = "awaiting_password";

      await ctx.reply(
        `✅ Account found for <b>${email}</b>.\n\n🔒 Now enter your <b>password</b>:`,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.error("[BOT] Account link error:", err);
      await ctx.reply("Something went wrong. Please try again.");
      ctx.session.step = "idle";
    }
    return;
  }

  // ── Account linking — Step 2: Password verification ──────────
  if (ctx.session.step === "awaiting_password") {
    const email = ctx.session.authEmail;
    const userId = ctx.session.authUserId;
    if (!email || !userId) {
      ctx.session.step = "idle";
      await ctx.reply("❌ Session expired. Send /start to try again.");
      return;
    }

    await ctx.reply("🔐 Verifying password...");

    // Delete the password message for security (best effort)
    try { await ctx.deleteMessage(); } catch { /* may fail without admin rights */ }

    const isValid = await verifyPassword(email, text);

    if (!isValid) {
      await ctx.reply(
        `❌ <b>Incorrect password.</b>\n\nPlease try again or send /start to restart.`,
        { parse_mode: "HTML" }
      );
      // Stay in awaiting_password so they can retry
      return;
    }

    // Password correct — link the account
    try {
      await saveTelegramChatId(userId, ctx.chat.id);

      ctx.session.linkedChatId = ctx.chat.id;
      ctx.session.linkedEmail = email;
      ctx.session.linkedRole = ctx.session.selectedRole === "admin" ? "admin" : "ngo";
      ctx.session.authEmail = undefined;
      ctx.session.authUserId = undefined;
      ctx.session.step = "idle";

      const roleLabelMap: Record<string, string> = {
        admin: "Admin 🔐",
        ngo: "NGO Coordinator 🏢",
        driver: "Driver 🚗",
      };
      const roleLabel = roleLabelMap[ctx.session.selectedRole || "ngo"] || "Linked";
      const helpHint = ctx.session.selectedRole === "driver"
        ? "Send /track to accept a rescue, or /help for all commands."
        : "Send /help to see your available commands.";

      await ctx.reply(
        `✅ <b>Account Linked!</b>\n\nWelcome, <b>${email}</b>!\nRole: ${roleLabel}\n\n${helpHint}`,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.error("[BOT] Link save error:", err);
      await ctx.reply("Something went wrong. Please try again.");
      ctx.session.step = "idle";
    }
    return;
  }

  // ── Driver: Track rescue by ID/link ───────────────────────
  if (ctx.session.step === "track_awaiting_id") {
    ctx.session.step = "idle";
    const rescueId = parseRescueId(text);
    if (!rescueId) {
      await ctx.reply(
        `❌ Could not find a rescue ID in your message.\n\nPlease paste the full driver link or just the ID:\n<code>PAW-2026-4823</code>`,
        { parse_mode: "HTML" }
      );
      return;
    }
    await handleAcceptRescue(ctx, rescueId);
    return;
  }

  // ── Status check ────────────────────────────────────────────
  if (ctx.session.step === "status_awaiting_id") {
    ctx.session.step = "idle";
    const rescueId = text.trim().toUpperCase().replace(/^#/, "");

    try {
      const { data: report, error } = await supabaseAdmin
        .from("reports")
        .select("id, species, location, severity, severity_label, status, created_at, ai_description")
        .eq("id", rescueId)
        .single();

      if (error || !report) {
        await ctx.reply(
          `❌ No rescue found with ID <code>${rescueId}</code>.\n\nDouble-check your ID and try again.\nIDs look like: <code>PAW-2026-4823</code>`,
          { parse_mode: "HTML" }
        );
        return;
      }

      const emoji = speciesEmoji[report.species] || "🐾";
      const statusEmoji: Record<string, string> = {
        pending: "🟡", dispatched: "🔵", completed: "✅", cancelled: "❌",
      };
      const statusLabel: Record<string, string> = {
        pending: "Awaiting NGO dispatch",
        dispatched: "Van en route",
        completed: "Rescue complete",
        cancelled: "Cancelled",
      };
      const created = new Date(report.created_at).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      });
      const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com"}/track?id=${rescueId}`;

      await ctx.reply(
        `🔍 <b>Rescue Status</b>\n\n` +
        `${emoji} <b>${report.species}</b>\n` +
        `📍 ${report.location}\n` +
        `📊 Severity: ${report.severity}/10 (${report.severity_label})\n` +
        `${statusEmoji[report.status] || "⬜"} <b>${statusLabel[report.status] || report.status.toUpperCase()}</b>\n` +
        `🕐 Reported: ${created}\n` +
        (report.ai_description ? `\n🤖 AI: ${report.ai_description}` : "") +
        `\n\n🔗 <a href="${trackUrl}">Track on Map →</a>`,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.error("[BOT] Status check error:", err);
      await ctx.reply("Something went wrong. Please try again.");
    }
    return;
  }

  // ── Admin rejection reason ──────────────────────────────────
  if (ctx.session.step === "admin_awaiting_rejection_reason") {
    const appId = ctx.session.pendingRejectAppId;
    if (!appId) { ctx.session.step = "idle"; return; }

    ctx.session.step = "idle";
    ctx.session.pendingRejectAppId = undefined;

    try {
      // Get org name first
      const { data: app } = await supabaseAdmin
        .from("ngo_applications")
        .select("org_name, user_id")
        .eq("id", appId)
        .single();

      await supabaseAdmin
        .from("ngo_applications")
        .update({ status: "rejected", rejection_reason: text, reviewed_at: new Date().toISOString() })
        .eq("id", appId);

      if (app) {
        await supabaseAdmin
          .from("profiles")
          .upsert({ id: app.user_id, role: "ngo", ngo_status: "rejected" });
      }

      await ctx.reply(`✅ <b>${app?.org_name || appId}</b> has been rejected.\n\nReason saved: "${text}"`, {
        parse_mode: "HTML",
      });
    } catch (err) {
      console.error("[BOT] Rejection error:", err);
      await ctx.reply("Something went wrong saving the rejection.");
    }
    return;
  }
});

// ─────────────────────────────────────────────────────────────
// Report confirm handler
// ─────────────────────────────────────────────────────────────
async function handleConfirmReport(ctx: BotContext) {
  const { reportPhotoFileId, reportSpecies, reportLat, reportLng } = ctx.session;

  if (!reportSpecies || !reportLat || !reportLng) {
    await ctx.reply("❌ Missing report data. Please start over with /report.");
    ctx.session.step = "idle";
    return;
  }

  ctx.session.step = "idle";
  await ctx.reply("⏳ Submitting your report...");

  try {
    // Get Telegram photo URL if we have a file_id
    let imageUrl: string | null = null;
    if (reportPhotoFileId) {
      const fileRes = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${reportPhotoFileId}`
      );
      const fileData = await fileRes.json();
      if (fileData.ok && fileData.result?.file_path) {
        imageUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
      }
    }

    // Run Gemini triage if we have an image
    let severity = 5;
    let severityLabel = "MODERATE";
    let aiDescription: string | null = null;
    let injuryTags: string[] | null = null;

    if (imageUrl) {
      try {
        const triage = await analyzeAnimalInjury(imageUrl, reportSpecies, "Reported via Telegram");
        severity = triage.severity;
        severityLabel = triage.severityLabel;
        aiDescription = triage.description;
        injuryTags = triage.tags;
      } catch {
        // Triage failed — use defaults
      }
    }

    const reporterChatId = ctx.chat?.id || null;
    const id = generateRescueId();
    const { error } = await supabaseAdmin.from("reports").insert({
      id,
      species: reportSpecies,
      description: "Reported via Telegram",
      lat: reportLat,
      lng: reportLng,
      location: `${reportLat.toFixed(4)}, ${reportLng.toFixed(4)}`,
      severity,
      severity_label: severityLabel,
      status: "pending",
      image_url: imageUrl,
      ai_description: aiDescription,
      injury_tags: injuryTags,
      assigned_ngo_id: null,
      reporter_chat_id: reporterChatId,
      source: "telegram",
    });

    if (error) throw error;

    const emoji = speciesEmoji[reportSpecies] || "🐾";
    await ctx.reply(
      `${emoji} <b>Report Submitted!</b>\n\n` +
      `🆔 Rescue ID: <code>${id}</code>\n` +
      `📊 Severity: ${severity}/10 (${severityLabel})\n\n` +
      `We are finding the nearest NGO. You will be notified when a van is dispatched.\n\n` +
      `Use /status to check your report anytime.`,
      {
        parse_mode: "HTML",
        reply_markup: { remove_keyboard: true },
      }
    );

    // Clear session
    ctx.session.reportPhotoFileId = undefined;
    ctx.session.reportSpecies = undefined;
    ctx.session.reportLat = undefined;
    ctx.session.reportLng = undefined;

  } catch (err) {
    console.error("[BOT] Report submit error:", err);
    await ctx.reply("Something went wrong submitting the report. Please try again.");
  }
}

// ─────────────────────────────────────────────────────────────
// Driver: Accept rescue
// ─────────────────────────────────────────────────────────────
async function handleAcceptRescue(ctx: BotContext, rescueId: string) {
  try {
    // Check it's not already accepted by someone else
    const { data: report } = await supabaseAdmin
      .from("reports")
      .select("status, species, location, lat, lng, assigned_ngo_id")
      .eq("id", rescueId)
      .single();

    if (!report) {
      await ctx.reply("❌ Rescue not found.");
      return;
    }

    if (report.status === "dispatched" || report.assigned_ngo_id) {
      await ctx.reply("⚠️ This rescue was already accepted by another driver.");
      return;
    }

    // Find this driver's profile
    const chatId = ctx.chat?.id;
    if (!chatId) {
      await ctx.reply("❌ Could not determine your chat ID.");
      return;
    }

    const { data: myProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telegram_chat_id", chatId)
      .single();

    if (!myProfile) {
      await ctx.reply("❌ Could not find your profile. Please /start again.");
      return;
    }

    // Update report
    await supabaseAdmin
      .from("reports")
      .update({ status: "dispatched", assigned_ngo_id: myProfile.id })
      .eq("id", rescueId);

    const navUrl = `https://maps.mapmyindia.com/direction?to=${report.lat},${report.lng}`;
    const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com"}/track?id=${rescueId}`;
    const emoji = speciesEmoji[report.species] || "🐾";

    await ctx.reply(
      `✅ <b>Rescue Accepted — ${rescueId}</b>\n\n` +
      `${emoji} ${report.species} at ${report.location}\n\n` +
      `🗺️ <a href="${navUrl}">Open Navigation →</a>\n` +
      `📍 <a href="${trackUrl}">Citizen Tracking Link →</a>\n\n` +
      `📡 <b>Share your Live Location</b> in this chat for 1 hour so the citizen can track you live on the map.\n\n` +
      `<i>Tap a stage button below as you progress:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📍 Reached Incident", callback_data: `stage:${rescueId}:arrived` },
              { text: "🐾 Animal Picked Up", callback_data: `stage:${rescueId}:secured` },
            ],
            [
              { text: "🏥 Heading to Shelter", callback_data: `stage:${rescueId}:heading_shelter` },
              { text: "✅ Rescue Complete", callback_data: `stage:${rescueId}:delivered` },
            ],
          ],
        },
      }
    );

    // Notify citizen via Telegram if they have reporter_chat_id stored
    try {
      const { data: fullReport } = await supabaseAdmin
        .from("reports")
        .select("reporter_chat_id, species")
        .eq("id", rescueId)
        .single();

      if (fullReport?.reporter_chat_id) {
        const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com"}/track?id=${rescueId}`;
        await sendMessage(
          fullReport.reporter_chat_id,
          `🚐 <b>Van Dispatched!</b>\n\nA rescue van is heading to your ${fullReport.species || "animal"} report.\n\n🔗 Track live: ${trackUrl}`
        );
      }
    } catch { /* non-fatal */ }

  } catch (err) {
    console.error("[BOT] Accept rescue error:", err);
    await ctx.reply("Something went wrong. Please try again.");
  }
}

// ─────────────────────────────────────────────────────────────
// Driver: Decline rescue
// ─────────────────────────────────────────────────────────────
async function handleDeclineRescue(ctx: BotContext, rescueId: string) {
  await ctx.reply(
    `❌ Rescue <code>${rescueId}</code> declined.\n\nThis has been noted. The NGO coordinator will reassign.`,
    { parse_mode: "HTML" }
  );

  // Notify all admin accounts that driver declined
  try {
    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("telegram_chat_id")
      .eq("role", "admin")
      .not("telegram_chat_id", "is", null);

    if (admins && admins.length > 0) {
      await Promise.all(
        admins.map((a: { telegram_chat_id: number }) =>
          sendMessage(
            a.telegram_chat_id,
            `⚠️ <b>Driver Declined Rescue</b>\n\nRescue <code>${rescueId}</code> was declined by the assigned driver.\n\nPlease reassign from the <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com"}/admin">Admin Panel</a>.`
          )
        )
      );
    }
  } catch { /* non-fatal */ }
}

// ─────────────────────────────────────────────────────────────
// Driver: Stage update
// ─────────────────────────────────────────────────────────────
async function handleStageUpdate(ctx: BotContext, rescueId: string, stage: string) {
  const stageToStatus: Record<string, string> = {
    arrived: "dispatched",
    secured: "dispatched",
    heading_shelter: "dispatched",
    delivered: "completed",
  };
  const stageLabels: Record<string, string> = {
    arrived: "Reached Incident 📍",
    secured: "Animal Picked Up 🐾",
    heading_shelter: "Heading to Shelter 🏥",
    delivered: "Rescue Complete ✅",
  };

  try {
    const newStatus = stageToStatus[stage] || "dispatched";
    await supabaseAdmin
      .from("reports")
      .update({ status: newStatus })
      .eq("id", rescueId);

    await ctx.reply(
      `✅ Stage updated: <b>${stageLabels[stage] || stage}</b>\n\nRescue ID: <code>${rescueId}</code>`,
      { parse_mode: "HTML" }
    );

    // Notify citizen if they have a reporter_chat_id
    try {
      const { data: report } = await supabaseAdmin
        .from("reports")
        .select("reporter_chat_id, species")
        .eq("id", rescueId)
        .single();

      if (report?.reporter_chat_id) {
        const species = report.species || "animal";
        const citizenMsgs: Record<string, string> = {
          arrived: `📍 Good news! The rescue van has <b>arrived</b> at the incident location.`,
          secured: `🐾 The ${species} has been <b>safely picked up</b> by the rescue team!`,
          heading_shelter: `🏥 The van is now <b>heading to the shelter</b> with the ${species}.`,
          delivered: `✅ <b>Rescue Complete!</b>\n\nThe ${species} has been safely brought to the shelter. Thank you for reporting! 🐾`,
        };
        const citizenMsg = citizenMsgs[stage];
        if (citizenMsg) {
          // For "secured", also resend the tracking link
          const extra = stage === "secured"
            ? `\n\n🔗 Track: ${process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com"}/track?id=${rescueId}`
            : "";
          await sendMessage(report.reporter_chat_id, citizenMsg + extra);
        }
      }
    } catch { /* non-fatal */ }

  } catch (err) {
    console.error("[BOT] Stage update error:", err);
    await ctx.reply("Something went wrong updating the stage.");
  }
}

// ─────────────────────────────────────────────────────────────
// Admin: Approve NGO
// ─────────────────────────────────────────────────────────────
async function handleApproveNgo(ctx: BotContext, appId: string) {
  try {
    const { data: app } = await supabaseAdmin
      .from("ngo_applications")
      .select("org_name, user_id")
      .eq("id", appId)
      .single();

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("ngo_applications")
      .update({ status: "approved", reviewed_at: now })
      .eq("id", appId);

    if (app) {
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: app.user_id, role: "ngo", ngo_status: "approved" });
    }

    await ctx.reply(
      `✅ <b>${app?.org_name || appId}</b> has been approved!\n\nThey can now login to the NGO dashboard.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("[BOT] Approve NGO error:", err);
    await ctx.reply("Something went wrong approving the NGO.");
  }
}

// ─────────────────────────────────────────────────────────────
// Driver: Live location updates (writes to DB for web tracking)
// ─────────────────────────────────────────────────────────────
const lastLocationPing = new Map<number, number>(); // chatId → timestamp

bot.on("message:location", async (ctx) => {
  // Only handle live location updates when NOT in report flow
  if (ctx.session.step === "report_awaiting_location") return;

  const { latitude, longitude } = ctx.message.location;
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Track last ping time for stale detection
  lastLocationPing.set(chatId, Date.now());

  // Find which rescue this driver is actively handling
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (!profile) return;

  const { data: activeReport } = await supabaseAdmin
    .from("reports")
    .select("id")
    .eq("assigned_ngo_id", profile.id)
    .eq("status", "dispatched")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!activeReport) return;

  // Update van GPS position in DB (same columns web driver page uses)
  await supabaseAdmin
    .from("reports")
    .update({
      van_lat: latitude,
      van_lng: longitude,
      van_updated_at: new Date().toISOString(),
    })
    .eq("id", activeReport.id);
});

// ─────────────────────────────────────────────────────────────
// Stale location detector — checks every 2 min, warns driver
// ─────────────────────────────────────────────────────────────
setInterval(async () => {
  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;

  for (const [chatId, lastPing] of lastLocationPing.entries()) {
    if (now - lastPing > TWO_MINUTES) {
      lastLocationPing.delete(chatId);

      // Check if they still have an active rescue
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("telegram_chat_id", chatId)
          .single();

        if (!profile) continue;

        const { data: activeReport } = await supabaseAdmin
          .from("reports")
          .select("id")
          .eq("assigned_ngo_id", profile.id)
          .eq("status", "dispatched")
          .limit(1)
          .single();

        if (activeReport) {
          await sendMessage(
            chatId,
            "📡 <b>Live location stopped.</b>\n\nPlease reshare your location to continue tracking for the rescue team."
          );
        }
      } catch { /* non-fatal */ }
    }
  }
}, 2 * 60 * 1000);
