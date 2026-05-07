/**
 * Device metadata for API requests (§1 FRONTEND_DEVICE_METADATA.md).
 * Sent as HTTP headers on every request to /api/v1/*.
 * Do not send device metadata in the request body.
 *
 * Includes GPS geolocation (§4): x-latitude / x-longitude.
 * If the user denies permission the headers are omitted and
 * the backend falls back to IP-based city-level geolocation.
 */

import { getDeviceId, getDeviceFingerprint } from "./security-headers";

export interface DeviceMetadataHeaders {
  "x-device-id": string;
  "x-device-fingerprint"?: string;
  "x-device-name"?: string;
  "x-device-model"?: string;
  platform?: string;
  "x-os-name"?: string;
  "x-os-version"?: string;
  "x-app-version"?: string;
  "x-latitude"?: string;
  "x-longitude"?: string;
}

const APP_VERSION =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_VERSION
    ? process.env.NEXT_PUBLIC_APP_VERSION
    : "0.1.0";

// ── Geolocation cache ────────────────────────────────────────────────

interface CachedCoords {
  lat: number;
  lng: number;
  timestamp: number;
}

const LOCATION_CACHE_KEY = "smipay-geo-cache";
const PERMISSION_KEY = "smipay-geo-perm";
// Cache location for 30 minutes — avoids repeated prompts while still
// giving the backend reasonably fresh coordinates.
const CACHE_TTL_MS = 30 * 60 * 1000;
// Only re-request from the browser at most once per 30 minutes.
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
let cachedLocation: CachedCoords | null = null;
let locationRefreshTimer: ReturnType<typeof setInterval> | null = null;
let locationRequested = false;

function persistLocation(coords: CachedCoords): void {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(coords));
  } catch { /* storage unavailable */ }
}

function loadPersistedLocation(): CachedCoords | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedCoords = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setPermissionState(state: "granted" | "denied"): void {
  try { localStorage.setItem(PERMISSION_KEY, state); } catch { /* */ }
}

function getPermissionState(): string | null {
  try { return localStorage.getItem(PERMISSION_KEY); } catch { return null; }
}

function fetchPosition(): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;

  // If user previously denied, don't prompt again — backend uses IP fallback.
  if (getPermissionState() === "denied") return;

  // If cache is still fresh, skip the browser call entirely.
  if (cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_TTL_MS) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      cachedLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: Date.now(),
      };
      persistLocation(cachedLocation);
      setPermissionState("granted");
    },
    (err) => {
      // PERMISSION_DENIED (code 1) = user said no — remember and stop asking.
      // Other errors (timeout, position unavailable) are transient; don't block future attempts.
      if (err.code === err.PERMISSION_DENIED) {
        setPermissionState("denied");
      }
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: CACHE_TTL_MS }
  );
}

/**
 * Initialise geolocation: load cached coords, request permission once
 * if needed, then refresh silently in the background.
 * Safe to call multiple times — only runs once.
 */
export function initGeolocation(): void {
  if (typeof window === "undefined" || locationRequested) return;
  locationRequested = true;

  cachedLocation = loadPersistedLocation();

  // Use the Permissions API (where supported) to check without prompting.
  // This avoids the iOS/Safari repeated dialog entirely when permission
  // was already granted or denied.
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (status.state === "granted") setPermissionState("granted");
        if (status.state === "denied") {
          setPermissionState("denied");
          return; // respect the denial — backend uses IP fallback
        }

        // Permission already granted — safe to fetch silently
        if (status.state === "granted" && !cachedLocation) {
          fetchPosition();
        }

        // "prompt" — only ask once if we have no coords at all
        if (status.state === "prompt" && !cachedLocation && getPermissionState() !== "denied") {
          fetchPosition();
        }

        // Listen for future changes (user toggles in Settings)
        status.addEventListener("change", () => {
          if (status.state === "granted") {
            setPermissionState("granted");
            fetchPosition();
          } else if (status.state === "denied") {
            setPermissionState("denied");
          }
        });
      })
      .catch(() => {
        // Permissions API not fully supported — fallback
        if (!cachedLocation && getPermissionState() !== "denied") {
          fetchPosition();
        }
      });
  } else {
    // No Permissions API (older iOS Safari) — only fetch if no cache
    if (!cachedLocation && getPermissionState() !== "denied") {
      fetchPosition();
    }
  }

  // Background refresh at a relaxed cadence — no-op if cache is still fresh
  locationRefreshTimer = setInterval(fetchPosition, REFRESH_INTERVAL_MS);

  // On tab-foreground: only refresh if cache is stale (fetchPosition checks)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") fetchPosition();
  });
}

// ── Static device helpers ────────────────────────────────────────────

function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return "Mobile Web";
  return "Web Browser";
}

function getDeviceModel(): string {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  const match = ua.match(/\((.*?)\)/);
  const part = match ? match[1] : ua;
  return part.substring(0, 80) || "Web";
}

function getPlatform(): string {
  return "web";
}

function getOsName(): string {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "Mac OS";
  if (/Linux/i.test(ua)) return "Linux";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  return "Web";
}

function getOsVersion(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  const win = ua.match(/Windows NT (\d+\.\d+)/);
  if (win) return win[1];
  const mac = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
  if (mac) return mac[1].replace(/_/g, ".");
  const android = ua.match(/Android (\d+\.?\d*)/);
  if (android) return android[1];
  const ios = ua.match(/OS (\d+[._]\d+[._]?\d*)/);
  if (ios) return ios[1].replace(/_/g, ".");
  return "";
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Build all device metadata headers for the current environment.
 * Required: x-device-id. Recommended: x-latitude, x-longitude.
 * Optional: rest of §1.1.
 */
export async function getDeviceMetadataHeaders(): Promise<DeviceMetadataHeaders> {
  // Ensure geolocation is initialised on first call
  initGeolocation();

  const deviceId = getDeviceId();
  const fingerprint = await getDeviceFingerprint();

  const headers: DeviceMetadataHeaders = {
    "x-device-id": deviceId,
    "x-device-fingerprint": fingerprint,
  };

  if (typeof navigator !== "undefined") {
    headers["x-device-name"] = getDeviceName();
    headers["x-device-model"] = getDeviceModel();
    headers.platform = getPlatform();
    headers["x-os-name"] = getOsName();
    const osVer = getOsVersion();
    if (osVer) headers["x-os-version"] = osVer;
    headers["x-app-version"] = APP_VERSION;
  }

  // Geolocation — omit if not available (backend falls back to IP)
  if (cachedLocation) {
    headers["x-latitude"] = cachedLocation.lat.toString();
    headers["x-longitude"] = cachedLocation.lng.toString();
  }

  return headers;
}
