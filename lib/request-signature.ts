import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";

/**
 * Request signing for the web — server side only. Mirrors
 * `backend/src/common/request-signing/request-signature.ts`.
 *
 * The browser never signs: anything it can compute a script can compute, so a
 * `NEXT_PUBLIC_` secret would defeat the gate. It calls `/api/backend/*`, which
 * signs here. The `server-only` import makes a client import a build error.
 */

export const SIGNATURE_VERSION = "v1";

/** Sentinel for multipart bodies neither side can hash. */
export const UNHASHED_BODY = "multipart";

const EMPTY_BODY_HASH = createHash("sha256").update("").digest("hex");

/** Path without query string or trailing slash, as the backend does. */
export function canonicalPath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? "";
  const trimmed = withoutQuery.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function hashBody(body: Buffer | null, multipart: boolean): string {
  if (multipart) return UNHASHED_BODY;
  if (!body || body.length === 0) return EMPTY_BODY_HASH;
  return createHash("sha256").update(body).digest("hex");
}

export interface SignedHeaders extends Record<string, string> {
  "x-timestamp": string;
  "x-nonce": string;
  "x-signature": string;
  "x-signature-version": string;
}

/** Throws when the secret is missing rather than sending an unsigned request. */
export function signOutboundRequest(input: {
  method: string;
  /** Backend path including the `/api/v1` prefix. */
  path: string;
  body: Buffer | null;
  multipart: boolean;
}): SignedHeaders {
  const secret = process.env.REQUEST_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "REQUEST_SIGNING_SECRET is not set on the web server. Note it is NOT a NEXT_PUBLIC_ variable — " +
        "it must never reach the browser. Set it to the same value as the backend's REQUEST_SIGNING_SECRET.",
    );
  }

  const timestamp = String(Date.now());
  const nonce = randomUUID();
  const message = [
    SIGNATURE_VERSION,
    input.method.toUpperCase(),
    canonicalPath(input.path),
    timestamp,
    nonce,
    hashBody(input.body, input.multipart),
  ].join(":");

  return {
    "x-timestamp": timestamp,
    "x-nonce": nonce,
    "x-signature": createHmac("sha256", secret).update(message).digest("hex"),
    "x-signature-version": SIGNATURE_VERSION,
  };
}

/** True when this server can sign at all. */
export function isSigningConfigured(): boolean {
  return (process.env.REQUEST_SIGNING_SECRET?.trim().length ?? 0) > 0;
}
