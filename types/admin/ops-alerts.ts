// --- Ops alert switches ---
//
// Runtime switches for developer alert emails (webhook forgery attempts,
// rejected VTPass webhooks, VTPass silence, wallet-integrity suspensions).
// One singleton row, toggled from Admin → Settings → Alerts — no redeploy.

export interface OpsAlertConfig {
  alert_recipients: string;
  paystack_forgery_alerts: boolean;
  vtpass_rejection_alerts: boolean;
  vtpass_silence_alerts: boolean;
  vtpass_silence_hours: number;
  wallet_integrity_alerts: boolean;
  alert_cooldown_minutes: number;
  /** Server-resolved effective recipients (admin list, else DEV_EMAILS). */
  resolved_recipients: string[];
}

export type OpsAlertConfigPayload = Partial<
  Omit<OpsAlertConfig, "resolved_recipients">
>;

export interface OpsAlertConfigResponse {
  success: boolean;
  message: string;
  data: OpsAlertConfig;
}

export interface OpsAlertTestResponse {
  success: boolean;
  message: string;
  data: { sent: boolean; recipients: string[]; note: string };
}
