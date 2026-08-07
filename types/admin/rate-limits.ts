// --- Rate limits ---
//
// Runtime overrides for the @RateLimit decorators in the backend. The code's
// decorator values remain the fallback; a stored row overrides them per
// request, so limits are retuned from the console without a rebuild.

export interface RateLimitValues {
  /** null = that dimension is not checked at all. */
  ip_limit: number | null;
  device_limit: number | null;
  phone_limit: number | null;
  window_seconds: number;
}

export interface RateLimitRule extends RateLimitValues {
  key: string;
  label: string;
  /** HTTP method + path this rule guards. */
  endpoint: string;
  description: string;
  enabled: boolean;
  /** What the decorator in the code says — the Reset target. */
  defaults: RateLimitValues;
  /** True when a row exists, i.e. the code default has been changed. */
  overridden: boolean;
  updatedAt: string | null;
  updated_by: string | null;
}

export interface RateLimitGroup {
  key: string;
  label: string;
  description: string;
  rules: RateLimitRule[];
}

export interface RateLimitBounds {
  limit: { min: number; max: number };
  window_seconds: { min: number; max: number };
}

export interface RateLimitsResponse {
  success: boolean;
  message: string;
  data: { groups: RateLimitGroup[]; bounds: RateLimitBounds };
}

export interface UpdateRateLimitPayload {
  key: string;
  enabled?: boolean;
  ip_limit?: number | null;
  device_limit?: number | null;
  phone_limit?: number | null;
  window_seconds?: number;
}
