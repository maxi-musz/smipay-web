/**
 * Authentication API Service
 *
 * New-auth endpoints (§3 FRONTEND_DEVICE_METADATA.md). The same endpoints are
 * used by the mobile app (see `mobile/src/api/services/auth.ts`), so the
 * password and OTP rules (exactly 6 digits each) are shared across both
 * clients. Device metadata headers (§1) are attached by api-client-backend on
 * every request.
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type { NewAuthUser } from "@/lib/auth-storage";

/** Standard envelope from backend */
interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/** Register payload (§3.1) */
export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  agree_to_terms: boolean;
  middle_name?: string;
  gender?: "male" | "female";
  referral_code?: string;
  country?: string;
  updates_opt_in?: boolean;
}

/** Register response: account created and auto-signed-in (§3.3 — same shape as sign-in) */
export interface RegisterResponseData {
  access_token: string;
  refresh_token: string | null;
  user: NewAuthUser;
}

/** Sign-in payload (§3.3) */
export interface SignInPayload {
  email: string;
  password: string;
}

/** Sign-in response (§3.3) */
export interface SignInResponseData {
  access_token: string;
  refresh_token: string | null;
  user: NewAuthUser;
}

/** Reset password payload (§3.6) */
export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
}

export const authApi = {
  /**
   * Step 1 — Request email verification (§3.1).
   * User enters email and clicks "Verify email". Backend sends OTP.
   */
  requestEmailVerification: async (email: string): Promise<ApiEnvelope> => {
    try {
      const response = await backendApi.post<ApiEnvelope>(
        "/new-auth/request-email-verification",
        { email: email.trim().toLowerCase() }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Step 2 — Verify email for registration (§3.2).
   * User enters OTP. On success, email is verified and user can call register.
   */
  verifyEmailForRegistration: async (
    email: string,
    otp: string
  ): Promise<ApiEnvelope> => {
    try {
      const response = await backendApi.post<ApiEnvelope>(
        "/new-auth/verify-email-for-registration",
        { email: email.trim().toLowerCase(), otp }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Step 3 — Register (§3.3). Email must already be verified (steps 1 & 2).
   * On success, user is auto-signed-in — response includes access_token + user.
   */
  register: async (
    data: RegisterPayload
  ): Promise<ApiEnvelope<RegisterResponseData>> => {
    try {
      const response = await backendApi.post<ApiEnvelope<RegisterResponseData>>(
        "/new-auth/register",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Legacy — Verify email OTP (§3.4) for flows where user already exists.
   * For registration flow use verifyEmailForRegistration instead.
   */
  verifyEmailOtp: async (email: string, otp: string): Promise<ApiEnvelope> => {
    try {
      const response = await backendApi.post<ApiEnvelope>(
        "/new-auth/verify-email-otp",
        {
          email,
          otp,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Sign in (§3.3) — email + password only.
   */
  login: async (
    credentials: SignInPayload
  ): Promise<ApiEnvelope<SignInResponseData>> => {
    try {
      const response = await backendApi.post<ApiEnvelope<SignInResponseData>>(
        "/new-auth/signin",
        credentials
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Forgot password — request OTP (§3.4).
   */
  requestPasswordReset: async (email: string): Promise<ApiEnvelope> => {
    try {
      const response = await backendApi.post<ApiEnvelope>(
        "/new-auth/forgot-password",
        {
          email,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Verify password reset OTP (§3.5) — step 2 of forgot flow.
   */
  verifyPasswordResetOtp: async (
    email: string,
    otp: string
  ): Promise<ApiEnvelope> => {
    try {
      const response = await backendApi.post<ApiEnvelope>(
        "/new-auth/verify-password-reset-otp",
        { email, otp }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Reset password (§3.6) — step 3: set new password with verified OTP.
   */
  resetPassword: async (data: ResetPasswordPayload): Promise<ApiEnvelope> => {
    try {
      const response = await backendApi.post<ApiEnvelope>(
        "/new-auth/reset-password",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Complete onboarding (§3.9) — marks user as having finished the walkthrough.
   * Idempotent: safe to call more than once.
   */
  completeOnboarding: async (): Promise<
    ApiEnvelope<{ has_completed_onboarding: boolean }>
  > => {
    try {
      const response = await backendApi.post<
        ApiEnvelope<{ has_completed_onboarding: boolean }>
      >("/new-auth/complete-onboarding");
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Logout (§3.10) — invalidates refresh tokens server-side.
   * Frontend must also discard stored tokens locally regardless of outcome.
   */
  logout: async (): Promise<void> => {
    try {
      await backendApi.post("/new-auth/logout");
    } catch {
      // Client clears auth regardless
    }
  },
};
