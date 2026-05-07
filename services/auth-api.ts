/**
 * Authentication API Service
 * Talks to the backend's `/new-auth` controller. The same endpoints are used
 * by the mobile app (see `mobile/src/api/services/auth.ts`), so the password
 * and OTP rules (exactly 6 digits each) are shared across both clients.
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";

const NEW_AUTH = "/new-auth";

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  agree_to_terms: boolean;
  country?: string;
  referral_code?: string;
  middle_name?: string;
  gender?: string;
  updates_opt_in?: boolean;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
}

export const authApi = {
  /** Step 1: Request email verification OTP for registration. */
  requestEmailOtp: async (email: string) => {
    try {
      const response = await backendApi.post(
        `${NEW_AUTH}/request-email-verification`,
        { email }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** Step 2: Verify the email OTP (6 digits). */
  verifyEmailOtp: async (email: string, otp: string) => {
    try {
      const response = await backendApi.post(
        `${NEW_AUTH}/verify-email-for-registration`,
        { email, otp }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** Step 3: Complete registration — sets the 6-digit password. */
  register: async (data: RegisterPayload) => {
    try {
      const response = await backendApi.post(`${NEW_AUTH}/register`, data);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** Sign in (legacy passwords still accepted by backend). */
  login: async (credentials: {
    email?: string;
    phone_number?: string;
    password: string;
  }) => {
    try {
      // Backend's SignInDto only accepts `email`. Phone-number sign-in is not
      // wired on /new-auth yet, so callers should pass `email` explicitly.
      const response = await backendApi.post(`${NEW_AUTH}/signin`, credentials);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** Send a 6-digit reset OTP to the user's email. */
  forgotPassword: async (email: string) => {
    try {
      const response = await backendApi.post(`${NEW_AUTH}/forgot-password`, {
        email,
      });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** Verify reset OTP + rotate password (must be 6 digits). */
  resetPassword: async (payload: ResetPasswordPayload) => {
    try {
      const response = await backendApi.post(
        `${NEW_AUTH}/reset-password`,
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  logout: async () => {
    try {
      const response = await backendApi.post(`${NEW_AUTH}/logout`);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  refreshToken: async (refresh_token: string) => {
    try {
      const response = await backendApi.post(`${NEW_AUTH}/refresh`, {
        refresh_token,
      });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
