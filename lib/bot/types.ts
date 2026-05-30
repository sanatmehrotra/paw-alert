// =============================================================
// PawAlert Telegram Bot — Session Types
// =============================================================

export type ConversationStep =
  | "idle"
  | "awaiting_role"
  | "awaiting_email"
  | "awaiting_password"
  // Report flow
  | "report_awaiting_photo"
  | "report_awaiting_species"
  | "report_awaiting_location"
  | "report_awaiting_confirm"
  // Status flow
  | "status_awaiting_id"
  // Driver track flow
  | "track_awaiting_id"
  // Admin reject flow
  | "admin_awaiting_rejection_reason";

export interface SessionData {
  step: ConversationStep;
  selectedRole?: "ngo" | "driver" | "admin";
  linkedChatId?: number;
  linkedEmail?: string;
  linkedRole?: string;
  // Auth temp state
  authEmail?: string;
  authUserId?: string;
  // Report temp state
  reportPhotoFileId?: string;
  reportSpecies?: string;
  reportLat?: number;
  reportLng?: number;
  // Admin reject temp
  pendingRejectAppId?: string;
  // Driver assignment temp
  pendingRescueId?: string;
}

export type BotContext = import("grammy").Context & {
  session: SessionData;
};
