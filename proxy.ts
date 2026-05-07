import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/wallet",
  "/transactions",
  "/settings",
  "/cards",
  "/unified-admin",
];

// Define auth routes (redirect to dashboard if already logged in)
const authRoutes = [
  "/auth/signin",
  "/auth/register",
];

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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

  // If payment callback or payment in progress, allow through and let client handle it
  if ((isPaymentCallback || paymentInProgress) && isProtectedRoute) {
    return NextResponse.next();
  }

  // Redirect to dashboard if accessing auth route with valid token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
