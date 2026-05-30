// =============================================================
// PawAlert Telegram Bot — Session Types
// =============================================================

export type ConversationStep =
  | "idle"
  | "awaiting_role"
  | "awaiting_email"
  | "awaiting_otp"        // NEW: OTP verification step for NGO/Admin linking
  // Report flow
  | "report_awaiting_photo"
  | "report_awaiting_species"
  | "report_awaiting_location"
  | "report_awaiting_confirm"
  // Status flow
  | "status_awaiting_id"
  // Admin reject flow
  | "admin_awaiting_rejection_reason";

export interface SessionData {
  step: ConversationStep;
  selectedRole?: "citizen" | "ngo" | "admin";
  linkedChatId?: number;
  linkedEmail?: string;
  linkedRole?: string;
  // Report temp state
  reportPhotoFileId?: string;
  reportSpecies?: string;
  reportLat?: number;
  reportLng?: number;
  // Admin reject temp
  pendingRejectAppId?: string;
  // Driver assignment temp
  pendingRescueId?: string;
  // OTP verification temp (for NGO/Admin account linking)
  otpEmail?: string;
  otpCode?: string;          // The code we generated
  otpAttempts?: number;      // Max 3 attempts
  otpUserId?: string;        // Supabase user ID found during email lookup
}

export type BotContext = import("grammy").Context & {
  session: SessionData;
};
