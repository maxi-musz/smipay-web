/**
 * Generate security headers required by backend
 * All endpoints require these headers as per SecurityHeadersGuard
 */

export interface SecurityHeaders {
  "x-request-id": string;
  "x-device-id": string;
  "x-device-fingerprint": string;
}

/**
 * Generate a unique nonce (UUID v4) - browser-compatible
 */
export function generateNonce(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Simple hash function for browser (SHA-256 using Web Crypto API)
 */
async function sha256Browser(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Request signing happens server-side in `app/api/backend/[...path]/route.ts`.
// Do not reintroduce a client-side `generateSignature`: a browser has no secret
// a script does not also have.

/**
 * Get or create device ID (stored in localStorage)
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "device-server";

  let deviceId = localStorage.getItem("smipay-device-id");
  if (!deviceId) {
    deviceId = `device-${generateNonce()}`;
    localStorage.setItem("smipay-device-id", deviceId);
  }
  return deviceId;
}

/**
 * Simple hash for fingerprint (browser-compatible)
 */
async function hashString(str: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    return await sha256Browser(str);
  }
  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get or create device fingerprint (based on browser characteristics)
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "fp-server";

  let fingerprint = sessionStorage.getItem("smipay-device-fingerprint");
  if (!fingerprint) {
    // Create simple fingerprint from browser characteristics
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
    ];
    const fingerprintString = components.join("|");
    const hash = await hashString(fingerprintString);
    fingerprint = `fp-${hash.substring(0, 16)}`;
    sessionStorage.setItem("smipay-device-fingerprint", fingerprint);
  }
  return fingerprint;
}

/** Identity and device hints — the headers a browser can legitimately produce. */
export async function generateSecurityHeaders(): Promise<SecurityHeaders> {
  return {
    "x-request-id": generateRequestId(),
    "x-device-id": getDeviceId(),
    "x-device-fingerprint": await getDeviceFingerprint(),
  };
}

/**
 * Check if security headers should be bypassed (development mode)
 */
export function shouldBypassSecurityHeaders(): boolean {
  return process.env.NEXT_PUBLIC_BYPASS_SECURITY_HEADERS === "true";
}

