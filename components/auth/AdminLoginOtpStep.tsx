"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/auth-api";
import { AUTH_EMAIL_OTP_DIGITS } from "@/lib/auth-password";
import type { NewAuthUser } from "@/lib/auth-storage";
import { motion } from "motion/react";

interface Props {
  challengeId: string;
  emailHint: string;
  resendAvailableAt: string;
  /** One-time notice from the password step (e.g. "code sent"). Cleared on error. */
  initialInfo?: string;
  onVerified: (data: {
    access_token: string;
    refresh_token: string | null;
    user: NewAuthUser;
  }) => void | Promise<void>;
  onBack: () => void;
  onChallengeUpdate: (update: {
    challengeId: string;
    emailHint: string;
    resendAvailableAt: string;
  }) => void;
}

export function AdminLoginOtpStep({
  challengeId,
  emailHint,
  resendAvailableAt,
  initialInfo = "",
  onVerified,
  onBack,
  onChallengeUpdate,
}: Props) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(initialInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendAt, setResendAt] = useState(() => new Date(resendAvailableAt));
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    setResendAt(new Date(resendAvailableAt));
  }, [resendAvailableAt]);

  useEffect(() => {
    const tick = () => {
      const diff = Math.ceil((resendAt.getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, diff));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [resendAt]);

  const formatCountdown = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!new RegExp(`^\\d{${AUTH_EMAIL_OTP_DIGITS}}$`).test(otp)) {
      setError(`Enter the ${AUTH_EMAIL_OTP_DIGITS}-digit code from your email.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.verifyAdminLoginOtp(challengeId, otp);
      if (response.success && response.data?.access_token && response.data.user) {
        await onVerified({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token ?? null,
          user: response.data.user,
        });
        return;
      }
      setError(response.message || "Invalid verification code.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid verification code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      const response = await authApi.resendAdminLoginOtp(challengeId);
      if (response.success && response.data) {
        onChallengeUpdate({
          challengeId: response.data.challenge_id,
          emailHint: response.data.email_hint,
          resendAvailableAt: response.data.resend_available_at,
        });
        // Keep whatever they typed — we may have reused the same code.
        if (!response.data.reused_existing_otp) {
          setOtp("");
        }
        setInfo(
          response.message ||
            (response.data.reused_existing_otp
              ? "A code was already sent and is still valid. Check your email."
              : "Verification code resent."),
        );
      } else {
        setError(response.message || "Could not resend code.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleVerify}
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-sm text-dashboard-muted">
        We sent a {AUTH_EMAIL_OTP_DIGITS}-digit code to{" "}
        <span className="font-medium text-dashboard-heading">{emailHint}</span>.
        Enter it below to complete admin sign-in.
      </p>

      {/* One banner only — error wins over success/info. */}
      {error ? (
        <FormError message={error} />
      ) : info ? (
        <FormSuccess message={info} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="admin-otp" className="label-auth">
          Verification code
        </Label>
        <Input
          id="admin-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={AUTH_EMAIL_OTP_DIGITS}
          placeholder={`${AUTH_EMAIL_OTP_DIGITS}-digit code`}
          value={otp}
          onChange={(e) => {
            setOtp(
              e.target.value.replace(/\D/g, "").slice(0, AUTH_EMAIL_OTP_DIGITS),
            );
            if (error) setError("");
          }}
          disabled={isSubmitting}
          className="input-auth tracking-[0.35em] text-center font-mono text-lg"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify and sign in"
        )}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={secondsLeft > 0 || isResending}
          className="text-dashboard-accent hover:underline disabled:text-dashboard-muted disabled:no-underline"
        >
          {isResending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
            </span>
          ) : secondsLeft > 0 ? (
            `Resend code in ${formatCountdown(secondsLeft)}`
          ) : (
            "Resend code"
          )}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-dashboard-muted hover:text-dashboard-heading"
        >
          Back to password
        </button>
      </div>
    </motion.form>
  );
}
