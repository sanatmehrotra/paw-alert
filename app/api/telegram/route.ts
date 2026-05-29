// =============================================================
// PawAlert — Telegram Webhook Handler
// POST /api/telegram — receives all Telegram updates
// =============================================================

import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";
import { NextRequest, NextResponse } from "next/server";

// grammY's webhookCallback wrapped for Next.js App Router
const handleUpdate = webhookCallback(bot, "std/http");

export async function POST(req: NextRequest) {
  // Verify secret token header (set when registering the webhook)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  try {
    return await handleUpdate(req);
  } catch (err) {
    console.error("[TELEGRAM WEBHOOK] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
