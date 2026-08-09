import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  MOBILE_ONLY_PATH,
  WEB_REGISTRATION_ENABLED,
  isCustomerRoute,
  shouldGateFromWeb,
} from "@/lib/web-access";

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/wallet",
  "/transactions",
  "/settings",
  "/cards",
  "/unified-admin",
  "/admin",
];

// Define auth routes (redirect to dashboard if already logged in)
const authRoutes = [
  "/auth/signin",
  "/auth/register",
];

/**
 * Reads `role` out of the access token without verifying the signature.
 *
 * That's deliberate and safe here: the only thing this decides is which page to
 * redirect to. Every real authorisation decision is made by the backend, which
 * does verify. A forged token buys an attacker nothing but a different landing
 * page. Verifying properly at the edge would mean shipping the JWT secret into
 * the proxy, which is worse.
 */
function roleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { role?: unknown };
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Web signup is closed while the product is mobile-only. Redirect before the
  // register page can render so the form never flashes.
  if (
    !WEB_REGISTRATION_ENABLED &&
    (pathname === "/auth/register" || pathname.startsWith("/auth/register/"))
  ) {
    return NextResponse.redirect(new URL(MOBILE_ONLY_PATH, request.url));
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Check if this is a payment callback (from Paystack, etc.)
  const isPaymentCallback = searchParams.get("payment") === "callback";
  void (searchParams.has("reference") || searchParams.has("trxref")); // reserved for payment callback handling

  // Get token from cookie or localStorage (handled client-side)
  // For server-side, we check if there's a token cookie
  const token = request.cookies.get("smipay-access-token")?.value;

  // Check for payment-in-progress flag in localStorage (via cookie)
  const paymentInProgress = request.cookies.get("smipay-payment-in-progress")?.value;

  // Allow payment callbacks through even without token
  // The dashboard will handle verification and auth
  if (isProtectedRoute && !token && !isPaymentCallback && !paymentInProgress) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Customers belong in the mobile app. Caught here rather than in a layout so
  // the dashboard shell never renders for a split second before redirecting.
  if (
    isCustomerRoute(pathname) &&
    shouldGateFromWeb(roleFromToken(token))
  ) {
    return NextResponse.redirect(new URL(MOBILE_ONLY_PATH, request.url));
  }

  // If payment callback or payment in progress, allow through and let client handle it
  if ((isPaymentCallback || paymentInProgress) && isProtectedRoute) {
    return NextResponse.next();
  }

  // Let the sign-in page decide client-side whether the session is valid.
  // A stale cookie alone must not bounce users away from sign-in (that caused
  // dashboard ↔ sign-in redirect loops when localStorage was cleared/expired).
  if (isAuthRoute && token) {
    return NextResponse.next();
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

// Specify which routes should use this proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
