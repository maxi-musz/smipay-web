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
import {
  AUTH_OTP_DIGITS,
  AUTH_PASSWORD_DIGITS,
  requestEmailOtpSchema,
  verifyEmailOtpSchema,
  completeRegistrationSchema,
} from "@/lib/validations/auth/register-backend.schema";
import { authApi } from "@/services/auth-api";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";

type Step = "email" | "verify-otp" | "complete";

interface RegistrationState {
  email: string;
  otp: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  referral_code: string;
  has_referral_code: boolean;
  agree_to_terms: boolean;
}

type FieldErrors = Partial<Record<keyof RegistrationState, string>>;

export default function RegisterNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [formData, setFormData] = useState<RegistrationState>({
    email: "",
    otp: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
    referral_code: "",
    has_referral_code: false,
    agree_to_terms: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegistrationState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Numeric-only inputs (OTP + password): strip non-digits and clamp to length.
  const handleNumericChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    maxLength: number
  ) => {
    const { name, value } = e.target;
    const cleaned = value.replace(/\D/g, "").slice(0, maxLength);
    setFormData((prev) => ({ ...prev, [name]: cleaned }));
    if (errors[name as keyof RegistrationState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Step 1: Request Email OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const result = requestEmailOtpSchema.safeParse({ email: formData.email });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((error) => {
        fieldErrors[error.path[0] as keyof RegistrationState] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.requestEmailOtp(formData.email);

      // Backend signals already-verified accounts via this flag.
      if (response.data?.email_already_verified) {
        setServerError(
          response.data.message || "Email is already registered. Please sign in."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(response.message);
      setOtpExpiresIn(response.data?.otp_expires_in || 300);
      setTimeout(() => {
        setStep("verify-otp");
        setSuccessMessage("");
        setIsLoading(false);
      }, 1200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send OTP.";
      setServerError(message);
      setIsLoading(false);
    }
  };

  // Step 2: Verify Email OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const result = verifyEmailOtpSchema.safeParse({
      email: formData.email,
      otp: formData.otp,
    });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((error) => {
        fieldErrors[error.path[0] as keyof RegistrationState] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.verifyEmailOtp(
        formData.email,
        formData.otp
      );

      if (response.data?.email_already_verified) {
        setServerError(
          response.data.message || "Email is already registered. Please sign in."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(response.message);
      setTimeout(() => {
        setStep("complete");
        setSuccessMessage("");
        setIsLoading(false);
      }, 900);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to verify OTP.";
      setServerError(message);
      setIsLoading(false);
    }
  };

  // Step 3: Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});

    const trimmedReferral = formData.has_referral_code
      ? formData.referral_code.trim()
      : "";

    const result = completeRegistrationSchema.safeParse({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number,
      password: formData.password,
      agree_to_terms: formData.agree_to_terms,
      referral_code: trimmedReferral,
      country: "Nigeria",
    });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((error) => {
        fieldErrors[error.path[0] as keyof RegistrationState] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        email: result.data.email,
        phone_number: result.data.phone_number,
        password: result.data.password,
        agree_to_terms: true,
        country: "Nigeria",
        ...(result.data.referral_code
          ? { referral_code: result.data.referral_code }
          : {}),
      });

      setSuccessMessage(
        response.message || "Registration completed successfully!"
      );
      setTimeout(() => {
        router.push("/auth/signin?registered=true");
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to complete registration.";
      setServerError(message);
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setServerError("");
    setSuccessMessage("");
    setErrors({});
    if (step === "verify-otp") {
      setStep("email");
    } else if (step === "complete") {
      setStep("verify-otp");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <AuthCard
        title={
          step === "email"
            ? "Create Your Smipay Account"
            : step === "verify-otp"
            ? "Verify Your Email"
            : "Complete Your Registration"
        }
        description={
          step === "email"
            ? "Enter your email to get started"
            : step === "verify-otp"
            ? `We've sent a ${AUTH_OTP_DIGITS}-digit code to ${formData.email}`
            : "Fill in your details to complete registration"
        }
      >
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs">
            <div className={`flex items-center gap-2 ${step === "email" ? "text-brand-bg-primary" : "text-green-600"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === "email" ? "bg-brand-bg-primary text-white" : "bg-green-600 text-white"}`}>
                {step === "email" ? "1" : <CheckCircle className="h-4 w-4" />}
              </div>
              <span>Email</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${step === "verify-otp" || step === "complete" ? "bg-green-600" : "bg-gray-200"}`} />
            <div className={`flex items-center gap-2 ${step === "verify-otp" ? "text-brand-bg-primary" : step === "complete" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === "verify-otp" ? "bg-brand-bg-primary text-white" : step === "complete" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                {step === "complete" ? <CheckCircle className="h-4 w-4" /> : "2"}
              </div>
              <span>Verify</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${step === "complete" ? "bg-green-600" : "bg-gray-200"}`} />
            <div className={`flex items-center gap-2 ${step === "complete" ? "text-brand-bg-primary" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === "complete" ? "bg-brand-bg-primary text-white" : "bg-gray-200"}`}>
                3
              </div>
              <span>Details</span>
            </div>
          </div>
        </div>

        {serverError && <FormError message={serverError} />}
        {successMessage && <FormSuccess message={successMessage} />}

        {/* Step 1: Enter Email */}
        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-bg-primary hover:bg-brand-bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>

            <div className="text-center text-sm text-brand-text-secondary">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-brand-bg-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === "verify-otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 mt-6">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Change email
            </button>

            <div className="space-y-2">
              <Label htmlFor="otp">Enter {AUTH_OTP_DIGITS}-digit code</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={formData.otp}
                onChange={(e) => handleNumericChange(e, AUTH_OTP_DIGITS)}
                disabled={isLoading}
                maxLength={AUTH_OTP_DIGITS}
                className={`text-center text-2xl tracking-widest ${errors.otp ? "border-red-500" : ""}`}
              />
              {errors.otp && <p className="text-xs text-red-600">{errors.otp}</p>}
              <p className="text-xs text-brand-text-secondary text-center">
                OTP expires in {Math.floor(otpExpiresIn / 60)} minutes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-bg-primary hover:bg-brand-bg-primary/90"
              disabled={isLoading || formData.otp.length !== AUTH_OTP_DIGITS}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() =>
                handleRequestOtp({ preventDefault: () => {} } as React.FormEvent)
              }
              disabled={isLoading}
            >
              Resend OTP
            </Button>
          </form>
        )}

        {/* Step 3: Complete Registration */}
        {step === "complete" && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4 mt-6">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={errors.first_name ? "border-red-500" : ""}
                />
                {errors.first_name && <p className="text-xs text-red-600">{errors.first_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={errors.last_name ? "border-red-500" : ""}
                />
                {errors.last_name && <p className="text-xs text-red-600">{errors.last_name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                placeholder="08012345678 or 2348012345678"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.phone_number ? "border-red-500" : ""}
              />
              {errors.phone_number && <p className="text-xs text-red-600">{errors.phone_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••"
                value={formData.password}
                onChange={(e) => handleNumericChange(e, AUTH_PASSWORD_DIGITS)}
                disabled={isLoading}
                error={errors.password}
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={AUTH_PASSWORD_DIGITS}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              <p className="text-xs text-brand-text-secondary">
                Exactly {AUTH_PASSWORD_DIGITS} digits (0–9) — your app password
              </p>
            </div>

            {/* Optional referral code, hidden behind a checkbox to avoid clutter — same UX as mobile */}
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-bg-primary focus:ring-brand-bg-primary"
                  checked={formData.has_referral_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      has_referral_code: e.target.checked,
                      referral_code: e.target.checked ? prev.referral_code : "",
                    }))
                  }
                  disabled={isLoading}
                />
                <span className="text-xs text-brand-text-secondary">
                  I have a referral code
                </span>
              </label>

              {formData.has_referral_code && (
                <div className="space-y-1.5">
                  <Input
                    id="referral_code"
                    name="referral_code"
                    placeholder="e.g. @janedoe"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={formData.referral_code}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s+/g, "");
                      setFormData((prev) => ({ ...prev, referral_code: v }));
                      if (errors.referral_code) {
                        setErrors((prev) => ({ ...prev, referral_code: undefined }));
                      }
                    }}
                    disabled={isLoading}
                    className={errors.referral_code ? "border-red-500" : ""}
                  />
                  {errors.referral_code && (
                    <p className="text-xs text-red-600">{errors.referral_code}</p>
                  )}
                  <p className="text-xs text-brand-text-secondary">
                    Got invited? Enter your friend&apos;s code so you both get a welcome bonus.
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-bg-primary focus:ring-brand-bg-primary"
                  checked={formData.agree_to_terms}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      agree_to_terms: e.target.checked,
                    }));
                    if (errors.agree_to_terms) {
                      setErrors((prev) => ({ ...prev, agree_to_terms: undefined }));
                    }
                  }}
                  disabled={isLoading}
                />
                <span className="text-xs text-brand-text-secondary">
                  I agree to the{" "}
                  <Link href="/terms" className="text-brand-bg-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-brand-bg-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.agree_to_terms && (
                <p className="text-xs text-red-600">{errors.agree_to_terms}</p>
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
                  Creating account...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
