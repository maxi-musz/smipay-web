import { NextRequest, NextResponse } from "next/server";

import { signOutboundRequest } from "@/lib/request-signature";
import { WEB_REGISTRATION_ENABLED } from "@/lib/web-access";

/**
 * Signing proxy for the backend API. The browser calls
 * `/api/backend/<backend path>`; this signs with `REQUEST_SIGNING_SECRET` —
 * server-side only — and forwards.
 *
 * Two things this must get right:
 *   - `x-forwarded-for` is passed through, or every web request reaches the
 *     backend wearing this server's IP and collapses the per-IP limits.
 *   - It must not become a public signing oracle. `SIGN_DENY_…` below refuses
 *     the sign-up flow while customer web access is off. If web sign-up is
 *     re-enabled, that surface needs a bot check (Turnstile), not a signature —
 *     no signature can tell a browser from a script driving one.
 */

/** Paths this proxy will never sign while customer web access is off. */
const SIGN_DENY_WHEN_WEB_SIGNUP_DISABLED = [
  "/new-auth/register",
  "/new-auth/register-with-profile-picture",
  "/new-auth/check-phone-availability",
  "/new-auth/request-phone-verification",
  "/new-auth/verify-phone-for-registration",
  "/new-auth/request-email-verification",
  "/new-auth/verify-email-for-registration",
  // Paid Dojah lookup + SMS; the web has no BVN flow.
  "/registration/bvn",
];

function isSignatureDenied(backendPathWithoutVersion: string): boolean {
  if (WEB_REGISTRATION_ENABLED) return false;
  // Express routes case-insensitively, so compare lowercased.
  const path = backendPathWithoutVersion.toLowerCase();
  return SIGN_DENY_WHEN_WEB_SIGNUP_DISABLED.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

const API_BASE_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? "/api/v1";

/** Hop-by-hop headers, plus the ones we recompute. */
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
  "te",
  "trailer",
  "content-length",
  // This server is the signer — never forward a caller-supplied signature.
  "x-signature",
  "x-signature-version",
  "x-timestamp",
  "x-nonce",
]);

const STRIPPED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
]);

function clientIpFrom(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded;
  const real = req.headers.get("x-real-ip");
  return real ?? null;
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (!API_BASE_URL) {
    console.error(
      "[backend-proxy] No backend URL configured (BACKEND_API_URL / NEXT_PUBLIC_API_URL).",
    );
    return NextResponse.json(
      { success: false, message: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  const { path } = await ctx.params;
  const routePath = `/${path.join("/")}`;
  const backendPath = `${API_VERSION}${routePath}`;
  const search = req.nextUrl.search ?? "";
  const target = `${API_BASE_URL}${backendPath}${search}`;

  if (isSignatureDenied(routePath)) {
    console.warn(
      `[backend-proxy] refused to sign ${req.method} ${routePath} — web sign-up is disabled.`,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Please create your account in the SmiPay app.",
      },
      { status: 403 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  const multipart = contentType.toLowerCase().includes("multipart/form-data");

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : null;

  let signed: Record<string, string>;
  try {
    signed = signOutboundRequest({
      method: req.method,
      path: backendPath,
      body,
      multipart,
    });
  } catch (err) {
    console.error("[backend-proxy]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, message: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  for (const [key, value] of Object.entries(signed)) headers.set(key, value);

  const clientIp = clientIpFrom(req);
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: body && body.length > 0 ? new Uint8Array(body) : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (err) {
    // Node's fetch reports a bare "fetch failed"; the useful detail is on
    // `cause`. Log the target too — this is almost always the API being down
    // or NEXT_PUBLIC_API_URL pointing at the wrong port.
    const cause = (err as { cause?: { code?: string; message?: string } })?.cause;
    const detail = cause?.code ?? cause?.message ?? (err instanceof Error ? err.message : String(err));
    console.error(
      `[backend-proxy] ${req.method} ${target} unreachable (${detail}). ` +
        "Is the API running, and does NEXT_PUBLIC_API_URL point at it?",
    );
    return NextResponse.json(
      { success: false, message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

// Uploads need the Node runtime, not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
