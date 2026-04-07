"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormError } from "@/components/auth/FormError";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestEmailOtpSchema,
  newAuthRegisterSchema,
  verifyEmailOtpSchema,
  type NewAuthRegisterData,
} from "@/lib/validations/auth/register-backend.schema";
import { authApi } from "@/services/auth-api";
import { useAuth } from "@/hooks/useAuth";
import { mapNewAuthUserToUser } from "@/lib/auth-storage";
import { Loader2, ArrowLeft, Mail, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/** Three-step registration flow per FRONTEND_DEVICE_METADATA.md §3.0 */
type Step = "verify-email" | "verify-otp" | "register";

const formVariants = {
  hidden: { opacity: 0 },
  visible: () => ({
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const STEPS: { id: Step; label: string }[] = [
  { id: "verify-email", label: "Verify email" },
  { id: "verify-otp", label: "Enter OTP" },
  { id: "register", label: "Create account" },
];

function stepIndex(step: Step): number {
  const i = STEPS.findIndex((s) => s.id === step);
  return i >= 0 ? i : 0;
}

const OTP_COUNTDOWN_SECONDS = 3 * 60; // 3 minutes

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PIN_LENGTH = 6;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("verify-email");
  const [formData, setFormData] = useState<
    NewAuthRegisterData & { otp: string }
  >({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    agree_to_terms: false,
    country: "",
    referral_code: "",
    otp: "",
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [pinFieldBlurred, setPinFieldBlurred] = useState(false);

  // 3-minute countdown when on verify-otp step
  useEffect(() => {
    if (step !== "verify-otp" || otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  /** 6-digit PIN only; max length enforced in handler */
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setFormData((prev) => ({ ...prev, password: digitsOnly }));
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
  };

  useEffect(() => {
    if (formData.password.length !== PIN_LENGTH) return;
    const el = document.getElementById("password") as HTMLInputElement | null;
    if (el && document.activeElement === el) el.blur();
  }, [formData.password]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /** Step 1: Request email verification → backend sends OTP */
  const handleRequestEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const parsed = requestEmailOtpSchema.safeParse({
      email: formData.email.trim().toLowerCase(),
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.requestEmailVerification(parsed.data.email);
      setFormData((prev) => ({ ...prev, email: parsed.data.email }));
      setSuccessMessage("OTP sent to your email. Enter it below.");
      setOtpCountdown(OTP_COUNTDOWN_SECONDS);
      setTimeout(() => {
        setStep("verify-otp");
        setSuccessMessage("");
      }, 1500);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Step 2: Verify OTP → email marked verified, user can submit step 3 */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const parsed = verifyEmailOtpSchema.safeParse({
      email: formData.email,
      otp: formData.otp,
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verifyEmailForRegistration(parsed.data.email, parsed.data.otp);
      setSuccessMessage("Email verified. Complete your profile below.");
      setTimeout(() => {
        setStep("register");
        setSuccessMessage("");
      }, 1200);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Invalid or expired OTP. Request a new code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Step 3: Register with full payload (email already verified) */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const parsed = newAuthRegisterSchema.safeParse({
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
      agree_to_terms: formData.agree_to_terms,
      referral_code: formData.referral_code || undefined,
      middle_name: undefined,
      gender: undefined,
      updates_opt_in: formData.updates_opt_in,
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.register({
        email: parsed.data.email,
        password: parsed.data.password,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        phone_number: parsed.data.phone_number,
        agree_to_terms: true,
        referral_code: parsed.data.referral_code || undefined,
        updates_opt_in: parsed.data.updates_opt_in ?? false,
      });

      if (response.success && response.data?.access_token) {
        const { access_token, user: apiUser } = response.data;
        const user = mapNewAuthUserToUser(apiUser);
        login(user, access_token);
        setSuccessMessage("Account created! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      } else {
        setSuccessMessage("Account created. Redirecting to sign in...");
        setTimeout(() => router.push("/auth/signin?registered=true"), 1500);
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  const goBackToEmail = () => {
    setServerError("");
    setSuccessMessage("");
    setErrors({});
    setFormData((prev) => ({ ...prev, otp: "" }));
    setOtpCountdown(0);
    setStep("verify-email");
  };

  /** Resend OTP (same as step 1 request-email-verification) */
  const handleResendOtp = async () => {
    if (!formData.email || otpCountdown > 0 || isResendingOtp) return;
    setServerError("");
    setSuccessMessage("");
    setIsResendingOtp(true);
    try {
      await authApi.requestEmailVerification(formData.email.trim().toLowerCase());
      setSuccessMessage("New code sent to your email.");
      setOtpCountdown(OTP_COUNTDOWN_SECONDS);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Failed to resend code. Try again."
      );
    } finally {
      setIsResendingOtp(false);
    }
  };

  const goBackToOtp = () => {
    setServerError("");
    setSuccessMessage("");
    setErrors({});
    setFormData((prev) => ({ ...prev, otp: "" }));
    setStep("verify-otp");
  };

  const currentStepIndex = stepIndex(step);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dashboard-bg px-4 py-12">
      <AuthCard
        title={
          step === "verify-email"
            ? "Create your Smipay account"
            : step === "verify-otp"
              ? "Verify your email"
              : "Complete your profile"
        }
        description={
          step === "verify-email"
            ? "Enter your email and we’ll send you a verification code"
            : step === "verify-otp"
              ? `We sent a 4-digit code to ${formData.email || "your email"}`
              : "Enter your details to finish registration"
        }
      >
        {/* 3-step progress */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-0 text-xs">
            {STEPS.map((s, i) => {
              const isActive = step === s.id;
              const isComplete = currentStepIndex > i;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  {i > 0 && (
                    <div
                      className={`flex-1 h-0.5 mx-0.5 rounded-full transition-colors ${
                        currentStepIndex > i ? "bg-emerald-500" : "bg-dashboard-border"
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isComplete
                          ? "bg-emerald-600 text-white"
                          : isActive
                            ? "bg-dashboard-heading text-white"
                            : "bg-dashboard-border text-dashboard-muted"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`font-medium truncate hidden sm:inline ${
                        isActive ? "text-dashboard-heading" : "text-dashboard-muted"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-0.5 rounded-full transition-colors ${
                        currentStepIndex > i ? "bg-emerald-500" : "bg-dashboard-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {serverError && <FormError message={serverError} />}
        {successMessage && <FormSuccess message={successMessage} />}

        <AnimatePresence mode="wait">
          {/* Step 1: Email only → request-email-verification */}
          {step === "verify-email" && (
            <motion.form
              key="verify-email"
              onSubmit={handleRequestEmailVerification}
              className="space-y-5 mt-6"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="label-auth">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`input-auth ${errors.email ? "input-auth-error" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-medium shadow-md shadow-orange-900/10"
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
                    Verify email
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-dashboard-muted">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="text-dashboard-accent hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </motion.form>
          )}

          {/* Step 2: OTP → verify-email-for-registration */}
          {step === "verify-otp" && (
            <motion.form
              key="verify-otp"
              onSubmit={handleVerifyOtp}
              className="space-y-5 mt-6"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <motion.button
                type="button"
                onClick={goBackToEmail}
                className="flex items-center gap-2 text-sm text-dashboard-muted hover:text-dashboard-heading transition-colors"
                whileHover={{ x: -2 }}
              >
                <ArrowLeft className="h-4 w-4" />
                Change email
              </motion.button>
              <div className="space-y-2">
                <Label htmlFor="otp" className="label-auth">
                  4-digit code
                </Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="1234"
                  value={formData.otp}
                  onChange={handleChange}
                  disabled={isLoading}
                  maxLength={4}
                  className={`input-auth text-center text-xl tracking-[0.4em] ${errors.otp ? "input-auth-error" : ""}`}
                />
                {errors.otp && (
                  <p className="text-xs text-red-600">{errors.otp}</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                {otpCountdown > 0 ? (
                  <p className="text-sm text-dashboard-muted">
                    Resend code in <span className="font-medium tabular-nums text-dashboard-heading">{formatCountdown(otpCountdown)}</span>
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={isResendingOtp || isLoading}
                    className="text-sky-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg"
                  >
                    {isResendingOtp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend OTP
                      </>
                    )}
                  </Button>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-medium shadow-md shadow-orange-900/10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & continue"
                )}
              </Button>
            </motion.form>
          )}

          {/* Step 3: Full form → register (email pre-filled, read-only) */}
          {step === "register" && (
            <motion.form
              key="register"
              onSubmit={handleRegister}
              className="mt-6"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                type="button"
                onClick={goBackToOtp}
                className="flex items-center gap-2 text-xs text-dashboard-muted hover:text-dashboard-heading transition-colors mb-4"
                whileHover={{ x: -2 }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change email or code
              </motion.button>

              <div className="space-y-3">
                {/* Personal: name + email */}
                <motion.div className="space-y-2" variants={fieldVariants}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="first_name" className="label-auth">
                        First name
                      </Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        placeholder="John"
                        value={formData.first_name}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`input-auth ${errors.first_name ? "input-auth-error" : ""}`}
                      />
                      {errors.first_name && (
                        <p className="text-xs text-red-600">{errors.first_name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last_name" className="label-auth">
                        Last name
                      </Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        placeholder="Doe"
                        value={formData.last_name}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`input-auth ${errors.last_name ? "input-auth-error" : ""}`}
                      />
                      {errors.last_name && (
                        <p className="text-xs text-red-600">{errors.last_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="label-auth">Email</Label>
                    <div className="input-auth input-auth-readonly flex items-center">
                      <span className="text-sm text-slate-600 truncate">{formData.email}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Phone + Password side by side */}
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" variants={fieldVariants}>
                  <div className="space-y-1">
                    <Label htmlFor="phone_number" className="label-auth">
                      Phone number
                    </Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      placeholder="08012345678"
                      value={formData.phone_number}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`input-auth ${errors.phone_number ? "input-auth-error" : ""}`}
                    />
                    {errors.phone_number && (
                      <p className="text-xs text-red-600">{errors.phone_number}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="label-auth">
                      6-digit PIN
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      maxLength={PIN_LENGTH}
                      placeholder="••••••"
                      value={formData.password}
                      onChange={handlePinChange}
                      onFocus={() => setPinFieldBlurred(false)}
                      onBlur={() => setPinFieldBlurred(true)}
                      disabled={isLoading}
                      className={`input-auth font-mono tracking-widest tabular-nums ${
                        errors.password ||
                        (pinFieldBlurred &&
                          formData.password.length > 0 &&
                          formData.password.length < PIN_LENGTH)
                          ? "input-auth-error"
                          : ""
                      }`}
                    />
                    {(errors.password ||
                      (pinFieldBlurred &&
                        formData.password.length > 0 &&
                        formData.password.length < PIN_LENGTH)) && (
                      <p className="text-xs text-red-600" role="alert">
                        {errors.password ?? "6 digits required"}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Collapsed referral */}
                <motion.div variants={fieldVariants}>
                  <button
                    type="button"
                    onClick={() => setShowReferralCode((v) => !v)}
                    className="flex items-center gap-1.5 text-sm text-dashboard-muted hover:text-dashboard-heading transition-colors"
                  >
                    {showReferralCode ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {showReferralCode ? "Hide referral code" : "Have a referral code?"}
                  </button>
                  {showReferralCode && (
                    <div className="mt-2 space-y-1">
                      <Label htmlFor="referral_code" className="label-auth">
                        Referral code
                      </Label>
                      <Input
                        id="referral_code"
                        name="referral_code"
                        placeholder="e.g. SMILE123"
                        value={formData.referral_code}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="input-auth"
                      />
                    </div>
                  )}
                </motion.div>

                {/* Terms */}
                <motion.div className="space-y-1 pt-0.5" variants={fieldVariants}>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      id="agree_to_terms"
                      name="agree_to_terms"
                      type="checkbox"
                      checked={formData.agree_to_terms}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="mt-0.5 h-4 w-4 rounded border-dashboard-border text-brand-bg-primary focus:ring-2 focus:ring-brand-bg-primary/20 focus:ring-offset-0"
                    />
                    <span className="text-sm text-dashboard-muted group-hover:text-dashboard-heading transition-colors">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-dashboard-accent hover:underline"
                        target="_blank"
                      >
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-dashboard-accent hover:underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.agree_to_terms && (
                    <p className="text-xs text-red-600">{errors.agree_to_terms}</p>
                  )}
                </motion.div>
              </div>

              <motion.div className="mt-4 space-y-2" variants={fieldVariants}>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-medium shadow-md shadow-orange-900/10"
                  disabled={
                    isLoading ||
                    !formData.first_name.trim() ||
                    !formData.last_name.trim() ||
                    !formData.phone_number.trim() ||
                    formData.password.length !== PIN_LENGTH ||
                    !formData.agree_to_terms
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
                <p className="text-center text-sm text-dashboard-muted">
                  Already have an account?{" "}
                  <Link
                    href="/auth/signin"
                    className="text-dashboard-accent hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}
