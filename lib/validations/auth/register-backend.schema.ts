import { z } from "zod";

/**
 * Step 1: Request Email OTP Schema
 */
export const requestEmailOtpSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
});

export type RequestEmailOtpData = z.infer<typeof requestEmailOtpSchema>;

/**
 * Step 2: Verify Email OTP Schema
 */
export const verifyEmailOtpSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .min(1, "OTP is required")
    .length(4, "OTP must be exactly 4 digits")
    .regex(/^\d{4}$/, "OTP must contain only numbers"),
});

export type VerifyEmailOtpData = z.infer<typeof verifyEmailOtpSchema>;

/**
 * Step 3: Complete Registration Schema
 */
export const completeRegistrationSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .trim(),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+?234|234|0)?[789][01]\d{8}$/,
      "Invalid Nigerian phone number. Use format: 08012345678 or 2348012345678"
    )
    .transform((val) => {
      // Normalize to 234XXXXXXXXXX format
      let cleaned = val.replace(/\D/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "234" + cleaned.substring(1);
      } else if (cleaned.startsWith("234")) {
        return cleaned;
      }
      return "234" + cleaned;
    }),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must not exceed 64 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  referral_code: z
    .string()
    .min(3, "Referral code must be at least 3 characters")
    .max(20, "Referral code must not exceed 20 characters")
    .regex(/^[A-Za-z0-9]+$/, "Referral code must be alphanumeric")
    .toUpperCase()
    .optional()
    .or(z.literal("")),
});

export type CompleteRegistrationData = z.infer<
  typeof completeRegistrationSchema
>;

/**
 * New-auth register (§3.1): single-step register with agree_to_terms.
 * Password is a 6-digit PIN (digits only).
 */
export const newAuthRegisterSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .length(6, "Enter exactly 6 digits")
      .regex(/^\d{6}$/, "PIN must be 6 numbers"),
    first_name: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters")
      .trim(),
    last_name: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters")
      .trim(),
    phone_number: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^(\+?234|234|0)?[789][01]\d{8}$/,
        "Invalid Nigerian phone number. Use format: 08012345678 or 2348012345678"
      )
      .transform((val) => {
        let cleaned = val.replace(/\D/g, "");
        if (cleaned.startsWith("0")) cleaned = "234" + cleaned.substring(1);
        else if (!cleaned.startsWith("234")) cleaned = "234" + cleaned;
        return cleaned;
      }),
    agree_to_terms: z.boolean(),
    country: z.string().max(100).optional().or(z.literal("")),
    referral_code: z
      .string()
      .max(20)
      .regex(/^[A-Za-z0-9]*$/, "Referral code must be alphanumeric")
      .optional()
      .or(z.literal("")),
    middle_name: z.string().max(50).optional().or(z.literal("")),
    gender: z.enum(["male", "female"]).optional(),
    updates_opt_in: z.boolean().optional(),
  })
  .refine((data) => data.agree_to_terms === true, {
    message: "You must agree to the terms and conditions",
    path: ["agree_to_terms"],
  });

export type NewAuthRegisterData = z.infer<typeof newAuthRegisterSchema>;

