"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormError } from "@/components/auth/FormError";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/auth-api";
import {
  AUTH_EMAIL_OTP_DIGITS,
  AUTH_PASSWORD_DIGITS,
  isAuthPasswordValid,
} from "@/lib/auth-password";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const emailSchema = (v: string) => {
  if (!v?.trim()) return "Email is required";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(v.trim()) ? null : "Invalid email address";
};

const otpSchema = (v: string) => {
  if (!v || v.length !== AUTH_EMAIL_OTP_DIGITS) {
    return `OTP must be exactly ${AUTH_EMAIL_OTP_DIGITS} digits`;
  }
  return new RegExp(`^\\d{${AUTH_EMAIL_OTP_DIGITS}}$`).test(v)
    ? null
    : "OTP must contain only numbers";
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    const err = emailSchema(email);
    if (err) {
      setErrors({ email: err });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const response = await authApi.requestPasswordReset(
        email.trim().toLowerCase()
      );
      setSuccessMessage(response.message || "OTP sent to your email.");
      setOtpSent(true);
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const emailErr = emailSchema(email);
    if (emailErr) {
      setErrors((prev) => ({ ...prev, email: emailErr }));
      return;
    }
    const otpErr = otpSchema(otp);
    if (otpErr) {
      setErrors((prev) => ({ ...prev, otp: otpErr }));
      return;
    }
    if (!isAuthPasswordValid(newPassword)) {
      setErrors((prev) => ({
        ...prev,
        newPassword: `Use exactly ${AUTH_PASSWORD_DIGITS} digits (0–9), same as sign-in.`,
      }));
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        new_password: newPassword,
      });
      setSuccessMessage("Password reset successfully. Redirecting to sign in...");
      setTimeout(() => router.push("/auth/signin"), 2000);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isResetReady =
    otpSent &&
    otp.length === AUTH_EMAIL_OTP_DIGITS &&
    isAuthPasswordValid(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dashboard-bg px-4 py-12">
      <AuthCard
        title="Forgot password"
        description={
          !otpSent
            ? `Enter your email to receive a ${AUTH_EMAIL_OTP_DIGITS}-digit code`
            : "Enter the code from your email and choose a new 6-digit PIN"
        }
      >
        {serverError && <FormError message={serverError} />}
        {successMessage && <FormSuccess message={successMessage} />}

        <motion.form
          onSubmit={otpSent ? handleResetPassword : handleRequestOtp}
          className="space-y-5 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="label-auth">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent || isLoading}
              readOnly={otpSent}
              className={`input-auth ${errors.email ? "input-auth-error" : ""} ${otpSent ? "input-auth-readonly" : ""}`}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!otpSent && (
              <motion.div
                key="send-otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-medium shadow-md shadow-orange-900/10"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {otpSent && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="otp" className="label-auth">
                  {AUTH_EMAIL_OTP_DIGITS}-digit OTP
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, AUTH_EMAIL_OTP_DIGITS)
                    )
                  }
                  disabled={isLoading}
                  maxLength={AUTH_EMAIL_OTP_DIGITS}
                  className={`input-auth text-center text-xl tracking-[0.35em] ${errors.otp ? "input-auth-error" : ""}`}
                />
                {errors.otp && (
                  <p className="text-xs text-red-600">{errors.otp}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="label-auth">New PIN</Label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  placeholder={`${AUTH_PASSWORD_DIGITS} digits`}
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value.replace(/\D/g, "").slice(0, AUTH_PASSWORD_DIGITS)
                    )
                  }
                  disabled={isLoading}
                  error={errors.newPassword}
                  className="input-auth"
                  inputMode="numeric"
                  maxLength={AUTH_PASSWORD_DIGITS}
                />
                <p className="text-xs text-dashboard-muted">
                  Exactly {AUTH_PASSWORD_DIGITS} numbers — same as registration and sign-in
                </p>
                {errors.newPassword && (
                  <p className="text-xs text-red-600">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-medium shadow-md shadow-orange-900/10"
                disabled={isLoading || !isResetReady}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </motion.div>
          )}
        </motion.form>

        <motion.p
          className="text-center text-sm text-dashboard-muted mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/auth/signin"
            className="text-dashboard-accent hover:underline"
          >
            Back to sign in
          </Link>
        </motion.p>
      </AuthCard>
    </div>
  );
}
