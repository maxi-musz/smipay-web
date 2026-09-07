/** Types for the KYC → BVN Verification admin tab. */

export type BvnFieldType = "boolean" | "number" | "enum";

export interface BvnConfigField {
  key: string;
  label: string;
  help: string;
  type: BvnFieldType;
  min?: number;
  max?: number;
  unit?: string;
  zero_label?: string;
  options?: Array<{ value: string; label: string; help?: string }>;
  depends_on?: { key: string; equals: Array<string | number | boolean> };
}

export interface BvnConfigGroup {
  key: string;
  label: string;
  description: string;
  icon: string;
  fields: BvnConfigField[];
}

/** Values are a flat key → value map; keys match the field keys. */
export type BvnConfigValues = Record<string, string | number | boolean>;

export interface BvnCredentialStatus {
  app_id: string | null;
  has_secret: boolean;
  source: "db" | "env" | "none";
  configured: boolean;
}

export interface BvnConfigPayload {
  config: BvnConfigValues;
  groups: BvnConfigGroup[];
  credentials: BvnCredentialStatus;
  provider_configured: boolean;
}

export interface BvnConfigResponse {
  success: boolean;
  message: string;
  data?: BvnConfigPayload;
}
