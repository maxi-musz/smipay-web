/**
 * Web is staff-only for now. Customers sign in fine, then we send them to
 * download the app. Flip NEXT_PUBLIC_ALLOW_USER_WEB_ACCESS=true to reopen.
 */

export const MOBILE_ONLY_PATH = "/download-app";

export const CUSTOMER_WEB_ACCESS_ENABLED =
  process.env.NEXT_PUBLIC_ALLOW_USER_WEB_ACCESS === "true";

export const WEB_REGISTRATION_ENABLED = CUSTOMER_WEB_ACCESS_ENABLED;

/** Anything other than "user" (support, finance, etc.). */
export function isStaffRole(role?: string | null): boolean {
  return typeof role === "string" && role !== "" && role !== "user";
}

export function isCustomerRole(role?: string | null): boolean {
  return !isStaffRole(role);
}

export function shouldGateFromWeb(role?: string | null): boolean {
  return !CUSTOMER_WEB_ACCESS_ENABLED && isCustomerRole(role);
}

export function customerHome(role?: string | null): string {
  return shouldGateFromWeb(role) ? MOBILE_ONLY_PATH : "/dashboard";
}

const CUSTOMER_ROUTES = [
  "/dashboard",
  "/profile",
  "/wallet",
  "/transactions",
  "/settings",
  "/cards",
];

// App store account-deletion requirement — leave this reachable on web.
const ALWAYS_ALLOWED = ["/profile/delete-account"];

export function isCustomerRoute(pathname: string): boolean {
  if (ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))) return false;
  return CUSTOMER_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
