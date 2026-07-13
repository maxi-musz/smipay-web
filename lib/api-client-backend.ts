import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearAuth } from "@/lib/auth-storage";
import { generateSecurityHeaders, shouldBypassSecurityHeaders } from "./security-headers";
import { getDeviceMetadataHeaders } from "./device-metadata";

// Build base URL with API version
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || "/api/v1";
const BASE_URL = `${API_BASE_URL}${API_VERSION}`;

// VTpass and similar flows often exceed 30s; aborting early hides real API errors behind a fake "network" message.
const BACKEND_REQUEST_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 120_000,
);

// Create axios instance for backend API
export const backendApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: BACKEND_REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Device metadata (§1), security headers, auth token
backendApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Device metadata on every request (§1 FRONTEND_DEVICE_METADATA.md)
    if (typeof window !== "undefined") {
      const deviceHeaders = await getDeviceMetadataHeaders();
      Object.assign(config.headers, deviceHeaders);
    }

    // Security headers if not bypassed
    if (!shouldBypassSecurityHeaders()) {
      const securityHeaders = await generateSecurityHeaders(config.data);
      Object.assign(config.headers, securityHeaders);
    }

    // Auth token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("smipay-access-token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Auth paths that do not require an existing session (login, register, etc.)
// 401 on these should NOT trigger "session expired" redirect.
const AUTH_PATHS_NO_SESSION = [
  "/auth/minimal-register/login",
  "/auth/minimal-register/request-email-otp",
  "/auth/minimal-register/verify-email-otp",
  "/auth/minimal-register/register",
  "/auth/request-password-reset",
  "/auth/verify-password-reset-otp",
  "/new-auth/request-email-verification",
  "/new-auth/verify-email-for-registration",
  "/new-auth/register",
  "/new-auth/verify-email-otp",
  "/new-auth/signin",
  "/new-auth/forgot-password",
  "/new-auth/verify-password-reset-otp",
  "/new-auth/reset-password",
];

function isAuthRequestWithoutSession(config: InternalAxiosRequestConfig): boolean {
  const path = config?.url ?? "";
  return AUTH_PATHS_NO_SESSION.some((p) => path.includes(p));
}

// Response interceptor - Handle errors
backendApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;

    // Handle 401 Unauthorized - Clear all auth data and redirect to login
    // Skip "session expired" redirect for login/register etc.; let the page show the real error.
    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (!config || !isAuthRequestWithoutSession(config)) {
        clearAuth();
        window.location.href = "/auth/signin?expired=true";
        return Promise.reject(error);
      }
    }

    // No HTTP response: browser timeout, offline, DNS, CORS, etc. — not the same as a failed purchase message from the API.
    if (!error.response) {
      const ax = error as AxiosError;
      const msg = (ax.message || "").toLowerCase();
      if (ax.code === "ECONNABORTED" || msg.includes("timeout")) {
        return Promise.reject({
          success: false,
          message:
            "This request took too long and was stopped. Your payment may still be processing — check Transaction history before trying again. If your wallet was debited but the purchase did not complete, contact SmiPay support.",
          statusCode: 408,
          code: "CLIENT_TIMEOUT",
        });
      }
      if (ax.code === "ERR_NETWORK" || msg.includes("network error")) {
        return Promise.reject({
          success: false,
          message:
            "Unable to reach our servers. Check your internet connection and try again.",
          statusCode: 0,
          code: "ERR_NETWORK",
        });
      }
      return Promise.reject({
        success: false,
        message:
          "We could not complete this request. Check your connection, or try again in a moment.",
        statusCode: 0,
        code: "NO_RESPONSE",
      });
    }

    // Return formatted error
    const errorData = error.response?.data as Record<string, unknown> | undefined;
    return Promise.reject({
      success: false,
      message: (errorData?.message as string) || error.message || "An error occurred",
      statusCode: error.response?.status,
      data: errorData,
    });
  }
);

export default backendApi;

