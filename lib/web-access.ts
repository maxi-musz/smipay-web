/**
 * Where the SmiPay product lives: the mobile app.
 *
 * The web app is staff-only. Customers keep their accounts and can still sign
 * in successfully — they're then pointed at the App Store / Play Store instead
 * of the dashboard, because the customer product is not maintained on web for
 * now. Marketing pages, the policy pages and account deletion stay public.
 *
 * Everything about that rule lives here so re-opening web to customers is a
 * one-line change (or an env var) rather than an archaeology exercise.
 */

/** Where customers are sent instead of the dashboard. */
export const MOBILE_ONLY_PATH = "/download-app";

/**
 * Set `NEXT_PUBLIC_ALLOW_USER_WEB_ACCESS=true` to give customers the web
 * dashboard (and web registration) back without a code change. Absent or
 * anything else keeps web staff-only, so a missing env var fails closed.
 */
export const CUSTOMER_WEB_ACCESS_ENABLED =
  process.env.NEXT_PUBLIC_ALLOW_USER_WEB_ACCESS === "true";

/**
 * New accounts are opened in the mobile app while web is staff-only. Same
 * switch as customer dashboard access — flipping the env reopens both.
 */
export const WEB_REGISTRATION_ENABLED = CUSTOMER_WEB_ACCESS_ENABLED;

/**
 * Staff is "any role that isn't a customer" — matching how the admin layouts
 * already decide. Checking `role === "admin"` instead would lock out support,
 * finance, compliance and operations, who all work in the console.
 */
export function isStaffRole(role?: string | null): boolean {
  return typeof role === "string" && role !== "" && role !== "user";
}

/** A customer: the explicit `user` role, or no role at all. */
export function isCustomerRole(role?: string | null): boolean {
  return !isStaffRole(role);
}

/** True when this person should be sent to the store links, not the dashboard. */
export function shouldGateFromWeb(role?: string | null): boolean {
  return !CUSTOMER_WEB_ACCESS_ENABLED && isCustomerRole(role);
}

/**
 * Where to send someone who turns out not to be staff — the store links while
 * web is staff-only, the dashboard once customers are let back in.
 */
export function customerHome(role?: string | null): string {
  return shouldGateFromWeb(role) ? MOBILE_ONLY_PATH : "/dashboard";
}

/** Customer-product route prefixes. Staff routes are deliberately absent. */
const CUSTOMER_ROUTES = [
  "/dashboard",
  "/profile",
  "/wallet",
  "/transactions",
  "/settings",
  "/cards",
];

/**
 * Self-service account deletion has to stay reachable — Apple and Google both
 * require it, and someone deleting their account is the one customer who
 * shouldn't be told to install the app first.
 */
const ALWAYS_ALLOWED = ["/profile/delete-account"];

export function isCustomerRoute(pathname: string): boolean {
  if (ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))) return false;
  return CUSTOMER_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
