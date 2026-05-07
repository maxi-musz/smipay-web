/**
 * Generate security headers required by backend
 * All endpoints require these headers as per SecurityHeadersGuard
 */

export interface SecurityHeaders {
  "x-timestamp": string;
  "x-nonce": string;
  "x-signature": string;
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

/**
 * Generate HMAC-SHA256 signature for request body (browser-compatible)
 * @param body - Request body as string or object
 * @param secret - Secret key for signing (from env)
 */
export async function generateSignature(
  body: string | Record<string, unknown>,
  secret: string
): Promise<string> {
  const bodyString = typeof body === "string" ? body : JSON.stringify(body);
  
  if (typeof window === "undefined") {
    // Server-side: Use Node.js crypto (dynamic import)
    const { createHmac } = await import("crypto");
    return createHmac("sha256", secret).update(bodyString).digest("hex");
  }

  // Browser: Use Web Crypto API
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(bodyString);

    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign("HMAC", key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error("Error generating signature:", error);
    // Fallback: simple hash
    return await sha256Browser(bodyString + secret);
  }
}

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

/**
 * Generate all required security headers for API requests
 * @param body - Request body (optional, used for signature)
 */
export async function generateSecurityHeaders(
  body?: Record<string, unknown> | string
): Promise<SecurityHeaders> {
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const requestId = generateRequestId();
  const deviceId = getDeviceId();
  const deviceFingerprint = await getDeviceFingerprint();

  const secret = process.env.NEXT_PUBLIC_API_SECRET || "default-secret-key";
  const signature = await generateSignature(body ?? "", secret);

  return {
    "x-timestamp": timestamp,
    "x-nonce": nonce,
    "x-signature": signature,
    "x-request-id": requestId,
    "x-device-id": deviceId,
    "x-device-fingerprint": deviceFingerprint,
  };
}

/**
 * Check if security headers should be bypassed (development mode)
 */
export function shouldBypassSecurityHeaders(): boolean {
  return process.env.NEXT_PUBLIC_BYPASS_SECURITY_HEADERS === "true";
}

