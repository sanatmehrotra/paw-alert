// =============================================================
// PawAlert — Internal Bot Notify Endpoint
// POST /api/bot/notify — server-side only, not exposed publicly
// Called by: dispatch route, NGO registration, etc.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  notifyDriverAssignment,
  notifyCitizenDispatched,
  notifyCitizenStageUpdate,
  notifyAdminNgoApplication,
  sendMessage,
} from "@/lib/bot/notifications";

export async function POST(req: NextRequest) {
  // Basic origin check — only allow same-origin or server-side calls
  const origin = req.headers.get("origin") || req.headers.get("host") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const isInternal =
    !origin || // server-side fetch has no origin
    origin.includes("localhost") ||
    (appUrl && origin.includes(new URL(appUrl).host));

  if (!isInternal) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, ...payload } = body;

    switch (type) {
      case "driver_assignment":
        await notifyDriverAssignment(payload);
        break;

      case "citizen_dispatched":
        await notifyCitizenDispatched(payload);
        break;

      case "citizen_stage":
        await notifyCitizenStageUpdate(payload);
        break;

      case "admin_ngo_application":
        await notifyAdminNgoApplication(payload);
        break;

      case "raw":
        // Generic: { chatId, text }
        if (!payload.chatId || !payload.text) {
          return NextResponse.json({ error: "chatId and text required" }, { status: 400 });
        }
        await sendMessage(payload.chatId, payload.text);
        break;

      default:
        return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BOT/NOTIFY] Error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
