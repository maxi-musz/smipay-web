/**
 * Relaxed rules for airtime phone field: `next dev` (NODE_ENV=development), or
 * set NEXT_PUBLIC_RELAX_PHONE_VALIDATION=true (e.g. prod-like local build while testing).
 */
export function isAirtimePhoneValidationRelaxed(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_RELAX_PHONE_VALIDATION === "true";
}
