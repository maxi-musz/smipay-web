/**
 * When true, bill-payment utilities stay visible in the UI but cannot be opened for purchase.
 * Toggle to false to re-enable VTU, cable, electricity, education, etc.
 */
export const UTILITIES_PURCHASES_DISABLED = true;

export const UTILITIES_DISABLED_HINT = "Temporarily unavailable";

const UTILITY_PATH_PREFIXES = [
  "/dashboard/airtime",
  "/dashboard/data",
  "/dashboard/cabletv",
  "/dashboard/electricity",
  "/dashboard/education",
  "/dashboard/intl-airtime",
  "/dashboard/betting",
] as const;

export function isUtilityPurchasePath(pathname: string): boolean {
  return UTILITY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isUtilityPurchaseHref(href: string): boolean {
  const path = href.split("?")[0];
  return UTILITY_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
