"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, Mail } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { FormError } from "@/components/auth/FormError";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AUTH_OTP_DIGITS,
  AUTH_PASSWORD_DIGITS,
} from "@/lib/validations/auth/register-backend.schema";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth/forgot-password-backend.schema";
import { authApi } from "@/services/auth-api";

type Step = "email" | "reset";
type Field = "email" | "otp" | "new_password";

const RESEND_COOLDOWN_S = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Tick the resend cooldown.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(
      () => setResendCooldown((v) => (v > 0 ? v - 1 : 0)),
      1000
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  function clearFieldError(field: Field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const result = requestPasswordResetSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Partial<Record<Field, string>> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as Field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword(result.data.email);
      setSuccessMessage(
        response?.message ||
          `If an account exists for that email, we've sent a ${AUTH_OTP_DIGITS}-digit reset code.`
      );
      setStep("reset");
      setResendCooldown(RESEND_COOLDOWN_S);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send reset code. Please try again.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || isLoading || !email) return;
    setServerError("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setOtp("");
      setSuccessMessage("A new reset code has been sent.");
      setResendCooldown(RESEND_COOLDOWN_S);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resend code. Please try again.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const result = resetPasswordSchema.safeParse({
      email,
      otp,
      new_password: newPassword,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<Field, string>> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as Field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword({
        email: result.data.email,
        otp: result.data.otp,
        new_password: result.data.new_password,
      });
      setSuccessMessage(
        response?.message ||
          "Password reset successfully. Sign in with your new password."
      );
      setTimeout(() => {
        router.push("/auth/signin?reset=true");
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.";
      setServerError(message);
      setIsLoading(false);
    }
  }

  const goBackToEmail = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    setErrors({});
    setServerError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <AuthCard
        title={step === "email" ? "Forgot Password?" : "Reset Password"}
        description={
          step === "email"
            ? "Enter your email and we'll send you a reset code."
            : `Enter the ${AUTH_OTP_DIGITS}-digit code sent to ${email} and your new ${AUTH_PASSWORD_DIGITS}-digit password.`
        }
      >
        {serverError && <FormError message={serverError} />}
        {successMessage && <FormSuccess message={successMessage} />}

        {step === "email" && (
          <form onSubmit={handleRequestReset} className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-bg-primary hover:bg-brand-bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Code
                </>
              )}
            </Button>

            <div className="text-center text-sm text-brand-text-secondary">
              Remembered it?{" "}
              <Link
                href="/auth/signin"
                className="text-brand-bg-primary hover:underline font-medium"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-5 mt-6">
            <button
              type="button"
              onClick={goBackToEmail}
              className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              Use a different email
            </button>

            <div className="space-y-2">
              <Label htmlFor="otp">Reset Code</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, AUTH_OTP_DIGITS));
                  clearFieldError("otp");
                }}
                disabled={isLoading}
                maxLength={AUTH_OTP_DIGITS}
                className={`text-center text-2xl tracking-widest ${
                  errors.otp ? "border-red-500" : ""
                }`}
              />
              {errors.otp && <p className="text-xs text-red-600">{errors.otp}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <PasswordInput
                id="new_password"
                name="new_password"
                placeholder="••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(
                    e.target.value.replace(/\D/g, "").slice(0, AUTH_PASSWORD_DIGITS)
                  );
                  clearFieldError("new_password");
                }}
                disabled={isLoading}
                error={errors.new_password}
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={AUTH_PASSWORD_DIGITS}
              />
              {errors.new_password && (
                <p className="text-xs text-red-600">{errors.new_password}</p>
              )}
              <p className="text-xs text-brand-text-secondary">
                Exactly {AUTH_PASSWORD_DIGITS} digits (0–9) — same as your sign-in password.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-bg-primary hover:bg-brand-bg-primary/90"
              disabled={
                isLoading ||
                otp.length !== AUTH_OTP_DIGITS ||
                newPassword.length !== AUTH_PASSWORD_DIGITS
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleResendOtp}
              disabled={isLoading || resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
            </Button>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
