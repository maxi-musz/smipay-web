import { z } from "zod";
import {
  AUTH_OTP_DIGITS,
  AUTH_PASSWORD_DIGITS,
} from "./register-backend.schema";

const SIX_DIGIT_REGEX = /^\d{6}$/;

/**
 * Step 1: Request password reset (send OTP to email).
 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
});

export type RequestPasswordResetData = z.infer<
  typeof requestPasswordResetSchema
>;

/**
 * Step 2: OTP + new password → backend verifies and rotates the password.
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .min(1, "OTP is required")
    .regex(SIX_DIGIT_REGEX, `Enter the ${AUTH_OTP_DIGITS}-digit code`),
  new_password: z
    .string()
    .min(1, "Password is required")
    .regex(
      SIX_DIGIT_REGEX,
      `Use exactly ${AUTH_PASSWORD_DIGITS} digits (0–9) — no letters or symbols`
    ),
});

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
