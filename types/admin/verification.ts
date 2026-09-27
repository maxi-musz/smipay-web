// `total` (customers only) is the denominator for every share; never divide by the drifting users.total counter.
export interface VerificationBreakdown {
  total: number;
  bvn_verified: number;
  phone_verified: number;
  email_verified: number;
  phone_and_bvn: number;
  unverified: number;
}

export type VerificationFlagFilter = "" | "true" | "false";

const BREAKDOWN_KEYS: readonly (keyof VerificationBreakdown)[] = [
  "total",
  "bvn_verified",
  "phone_verified",
  "email_verified",
  "phone_and_bvn",
  "unverified",
];

export function asVerificationBreakdown(
  value: VerificationBreakdown | null | undefined,
): VerificationBreakdown | null {
  if (!value) return null;
  return BREAKDOWN_KEYS.every((k) => Number.isFinite(value[k])) ? value : null;
}

export function pct(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0 || part <= 0) {
    return 0;
  }
  return Math.min(100, (part / total) * 100);
}

// Near-0/near-100 shares must not round to a misleading "0.0%" or "100.0%".
export function formatPct(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  if (value >= 100) return "100%";
  if (value < 0.1) return "<0.1%";
  if (value >= 99.95) return ">99.9%";
  return `${value.toFixed(1)}%`;
}
