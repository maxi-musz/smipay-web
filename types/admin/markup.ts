// --- Config ---

export interface MarkupConfig {
  id: string;
  is_active: boolean;
  default_percentage: number;
  default_percentage_friendlies: number | null;
  min_amount_to_apply_markup: number | null;
  updated_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkupConfigPayload {
  is_active?: boolean;
  default_percentage?: number;
  default_percentage_friendlies?: number | null;
  min_amount_to_apply_markup?: number | null;
}

// --- Rules ---

export type MarkupServiceType =
  | "airtime"
  | "data"
  | "cable"
  | "electricity"
  | "education"
  | "betting"
  | "international_airtime";

export interface MarkupRule {
  id: string;
  service_type: MarkupServiceType;
  is_active: boolean;
  percentage: number;
  percentage_friendlies: number | null;
  min_amount_to_apply_markup: number | null;
  updated_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkupRulePayload {
  service_type?: MarkupServiceType;
  percentage?: number;
  is_active?: boolean;
  percentage_friendlies?: number | null;
  min_amount_to_apply_markup?: number | null;
}

// --- Responses ---

export interface MarkupConfigResponse {
  success: boolean;
  message: string;
  data: {
    config: MarkupConfig;
    rules: MarkupRule[];
  };
}

export interface MarkupRulesResponse {
  success: boolean;
  message: string;
  data: MarkupRule[];
}

export interface MarkupRuleResponse {
  success: boolean;
  message: string;
  data: MarkupRule;
}

export interface MarkupSeedResponse {
  success: boolean;
  message: string;
  data: MarkupRule[];
}

// --- Display helpers ---

export const MARKUP_SERVICE_TYPES: {
  value: MarkupServiceType;
  label: string;
}[] = [
  { value: "airtime", label: "Airtime" },
  { value: "data", label: "Data" },
  { value: "cable", label: "Cable TV" },
  { value: "electricity", label: "Electricity" },
  { value: "education", label: "Education" },
  { value: "betting", label: "Betting" },
  { value: "international_airtime", label: "Intl Airtime" },
];
