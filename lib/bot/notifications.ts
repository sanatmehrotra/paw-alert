// =============================================================
// PawAlert Telegram Bot — Notification helpers
// Send messages to any chat ID from server-side code
// =============================================================

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_API = `https://api.telegram.org/bot${TOKEN}`;

async function tgPost(method: string, body: object): Promise<void> {
  if (!TOKEN) {
    console.warn("[TG] TELEGRAM_BOT_TOKEN not set — skipping notification");
    return;
  }
  try {
    const res = await fetch(`${TG_API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[TG] ${method} failed:`, txt);
    }
  } catch (err) {
    console.error(`[TG] ${method} error:`, err);
  }
}

/** Send plain text to a chat */
export async function sendMessage(
  chatId: number | string,
  text: string,
  extra?: object
): Promise<void> {
  await tgPost("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

/** Notify a driver about a new rescue assignment */
export async function notifyDriverAssignment(opts: {
  chatId: number;
  rescueId: string;
  species: string;
  severity: number;
  severityLabel: string;
  locationName: string;
  incidentLat: number;
  incidentLng: number;
}) {
  const { chatId, rescueId, species, severity, severityLabel, locationName } = opts;
  const speciesEmoji: Record<string, string> = {
    Dog: "🐕", Cat: "🐈", Cow: "🐄", Bird: "🦅", Other: "🐾",
  };
  const emoji = speciesEmoji[species] || "🐾";
  const severityEmoji = severity >= 9 ? "🚨" : severity >= 7 ? "⚠️" : "📋";

  await tgPost("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `${severityEmoji} <b>New Rescue Assignment</b>\n\n` +
      `${emoji} Animal: <b>${species}</b>\n` +
      `📊 Severity: <b>${severity}/10 (${severityLabel})</b>\n` +
      `📍 Location: ${locationName}\n` +
      `🆔 Rescue ID: <code>${rescueId}</code>\n\n` +
      `Please accept or decline within 5 minutes.`,
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Accept", callback_data: `accept_rescue:${rescueId}` },
        { text: "❌ Decline", callback_data: `decline_rescue:${rescueId}` },
      ]],
    },
  });
}

/** Notify citizen that their rescue was dispatched */
export async function notifyCitizenDispatched(opts: {
  chatId: number;
  rescueId: string;
  species: string;
}) {
  const { chatId, rescueId, species } = opts;
  const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com"}/track?id=${rescueId}`;
  await sendMessage(
    chatId,
    `🚐 <b>Van Dispatched!</b>\n\nA rescue van is on its way for your ${species} report.\n\n🔗 Track live: ${trackUrl}`,
  );
}

/** Notify citizen of stage update */
export async function notifyCitizenStageUpdate(opts: {
  chatId: number;
  stage: string;
  rescueId: string;
  species: string;
}) {
  const { chatId, stage, rescueId, species } = opts;
  const stageMessages: Record<string, string> = {
    arrived: `📍 The rescue van has <b>arrived</b> at the incident location.`,
    secured: `🐾 The ${species} has been <b>picked up safely</b>!`,
    heading_shelter: `🏥 The van is now <b>heading to the shelter</b>.`,
    delivered: `✅ <b>Rescue Complete!</b>\n\nThe ${species} has been safely brought to the shelter. Thank you for reporting! 🐾`,
  };
  const msg = stageMessages[stage] || `📋 Rescue <code>${rescueId}</code> status updated: ${stage}`;
  await sendMessage(chatId, msg);
}

/** Notify admin of new NGO application */
export async function notifyAdminNgoApplication(opts: {
  chatId: number;
  applicationId: string;
  orgName: string;
  city: string;
  email: string;
  submittedAt: string;
}) {
  const { chatId, applicationId, orgName, city, email, submittedAt } = opts;
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://paw-alert.onrender.com"}/admin`;
  const date = new Date(submittedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  await tgPost("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `📋 <b>New NGO Application</b>\n\n` +
      `🏢 Organisation: <b>${orgName}</b>\n` +
      `🌆 City: ${city}\n` +
      `📧 Email: ${email}\n` +
      `📅 Applied: ${date}\n\n` +
      `<a href="${adminUrl}">View full details on Admin Panel →</a>`,
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Approve", callback_data: `approve_ngo:${applicationId}` },
        { text: "❌ Reject", callback_data: `reject_ngo:${applicationId}` },
      ]],
    },
  });
}
