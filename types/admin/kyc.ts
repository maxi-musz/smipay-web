export type TierPropertyValueType =
  | "NUMBER"
  | "BOOLEAN"
  | "STRING"
  | "VERIFICATION";

export interface TierPropertyDefinition {
  id: string;
  key: string;
  label: string;
  description: string | null;
  value_type: TierPropertyValueType;
  unit: string | null;
  category: string | null;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TierPropertyAssignment {
  id: string;
  key: string;
  label: string;
  description: string | null;
  value_type: TierPropertyValueType;
  unit: string | null;
  category: string | null;
  value: unknown;
}

export interface KycTier {
  id: string;
  tier: string;
  name: string;
  description: string | null;
  is_active: boolean;
  order: number;
  requirements: string[];
  properties: TierPropertyAssignment[];
  limits: {
    single_transaction_limit: number;
    daily_limit: number;
    monthly_limit: number;
    airtime_daily_limit: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KycOverviewResponse {
  success: boolean;
  message: string;
  data?: {
    tiers: KycTier[];
    properties: TierPropertyDefinition[];
    total_tiers: number;
    total_properties: number;
  };
}

export interface CreateKycTierPayload {
  tier: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateKycTierPayload {
  tier?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  order?: number;
}

export interface CreateTierPropertyPayload {
  key: string;
  label: string;
  description?: string;
  value_type: TierPropertyValueType;
  unit?: string;
  category?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateTierPropertyPayload {
  key?: string;
  label?: string;
  description?: string;
  value_type?: TierPropertyValueType;
  unit?: string;
  category?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface TierPropertyAssignmentPayload {
  property_id: string;
  value?: unknown;
}

export const TIER_PROPERTY_VALUE_TYPES: TierPropertyValueType[] = [
  "NUMBER",
  "BOOLEAN",
  "STRING",
  "VERIFICATION",
];

export const TIER_PROPERTY_CATEGORIES = [
  "limits",
  "verification",
  "features",
  "general",
] as const;
