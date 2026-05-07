import { z } from "zod";

/**
 * New-auth signin (§3.3): email + password only.
 * Matches backend SignInDto: non-empty password, max 256; we use min 6 for basic UX (not 8).
 */
export const loginBackendSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(256, "Password must not exceed 256 characters"),
});

export type LoginBackendData = z.infer<typeof loginBackendSchema>;

