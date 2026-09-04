"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormError } from "@/components/auth/FormError";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginBackendSchema,
  type LoginBackendData,
} from "@/lib/validations/auth/login-backend.schema";
import { authApi } from "@/services/auth-api";
import { useAuth } from "@/hooks/useAuth";
import {
  mapNewAuthUserToUser,
  clearAuth,
  hasValidClientSession,
  consumeIntentionalLogout,
} from "@/lib/auth-storage";
import {
  fetchAdminHomePath,
  resolveStaffRedirect,
} from "@/lib/admin-home";
import { adminManagementApi } from "@/services/admin/management-api";
import {
  MOBILE_ONLY_PATH,
  WEB_REGISTRATION_ENABLED,
  shouldGateFromWeb,
} from "@/lib/web-access";
import { useAdminPermissionsStore } from "@/store/admin/admin-permissions-store";
import { AdminLoginOtpStep } from "@/components/auth/AdminLoginOtpStep";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

const formVariants = {
  hidden: { opacity: 0 },
  visible: () => ({
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading: authLoading,
    initializeAuth,
  } = useAuth();
  const [formData, setFormData] = useState<LoginBackendData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginBackendData>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpStep, setOtpStep] = useState<{
    flow: "admin" | "device";
    challengeId: string;
    emailHint: string;
    resendAvailableAt: string;
    initialInfo?: string;
  } | null>(null);
  /** Prevents the “already signed in” effect from racing finishLogin(). */
  const skipAutoRedirect = useRef(false);

  const showError = (message: string) => {
    setSuccessMessage("");
    setServerError(message);
  };
  const showSuccess = (message: string) => {
    setServerError("");
    setSuccessMessage(message);
  };

  /** Drop stale ?expired / ?signed_out so they can't re-flash over the OTP step. */
  const scrubAuthFlashParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    let dirty = false;
    for (const key of ["expired", "signed_out", "message", "registered", "reset"]) {
      if (params.has(key)) {
        params.delete(key);
        dirty = true;
      }
    }
    if (!dirty) return;
    const qs = params.toString();
    router.replace(qs ? `/auth/signin?${qs}` : "/auth/signin", { scroll: false });
  };

  useEffect(() => {
    initializeAuth();
    if (!hasValidClientSession()) {
      clearAuth();
    }
  }, [initializeAuth]);

  // Already signed in — skip the form and go to the intended destination.
  useEffect(() => {
    if (authLoading || !isAuthenticated || skipAutoRedirect.current) return;

    void (async () => {
      const callbackUrl = searchParams.get("callbackUrl");

      // Wait for user to load so we don't kick staff out by mistake.
      if (user && shouldGateFromWeb(user.role)) {
        logout();
        router.replace(MOBILE_ONLY_PATH);
        return;
      }

      if (user?.role && user.role !== "user") {
        try {
          const res = await adminManagementApi.getMyPermissions();
          const redirectUrl = await resolveStaffRedirect(
            callbackUrl,
            res.data ?? null,
          );
          router.replace(redirectUrl);
        } catch {
          router.replace(await fetchAdminHomePath());
        }
        return;
      }

      const redirectUrl =
        callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
      router.replace(redirectUrl);
    })();
  }, [isAuthenticated, authLoading, router, searchParams, user, logout]);

  useEffect(() => {
    // While verifying admin OTP, ignore URL flash params — the OTP step owns notices.
    if (otpStep) return;

    if (searchParams.get("registered") === "true") {
      queueMicrotask(() =>
        showSuccess("Registration successful! Please sign in to continue."),
      );
      return;
    }
    if (searchParams.get("reset") === "true") {
      queueMicrotask(() =>
        showSuccess(
          "Password reset successfully. Please sign in with your new password.",
        ),
      );
      return;
    }
    if (searchParams.get("signed_out") === "true") {
      consumeIntentionalLogout();
      queueMicrotask(() => showSuccess("You have been signed out."));
      return;
    }
    if (searchParams.get("expired") === "true") {
      // Intentional logout can still race a 401 into ?expired=true — don't scare the user.
      if (consumeIntentionalLogout()) {
        queueMicrotask(() => showSuccess("You have been signed out."));
        return;
      }
      const message = searchParams.get("message");
      queueMicrotask(() =>
        showError(
          message || "Your session has expired. Please sign in again.",
        ),
      );
    }
    // otpStep / showSuccess / showError are stable enough for this flash effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, otpStep]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginBackendData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const finishLogin = async (
    access_token: string,
    apiUser: Parameters<typeof mapNewAuthUserToUser>[0],
  ) => {
    skipAutoRedirect.current = true;
    const user = mapNewAuthUserToUser(apiUser);

    // Login ok, but customers use the app — don't keep a web session.
    if (shouldGateFromWeb(user.role)) {
      setOtpStep(null);
      clearAuth();
      setSuccessMessage("Signed in. Continue in the SmiPay mobile app...");
      router.replace(MOBILE_ONLY_PATH);
      return;
    }

    login(user, access_token);
    setOtpStep(null);
    setSuccessMessage("Login successful! Redirecting...");

    let redirectUrl = "/dashboard";
    if (user.role && user.role !== "user") {
      useAdminPermissionsStore.getState().invalidate();
      try {
        const res = await adminManagementApi.getMyPermissions();
        if (res.success && res.data) {
          useAdminPermissionsStore.setState({
            data: res.data,
            fetched: true,
            ts: Date.now(),
            error: null,
            loading: false,
          });
          redirectUrl = await resolveStaffRedirect(
            searchParams.get("callbackUrl"),
            res.data,
          );
        } else {
          redirectUrl = await fetchAdminHomePath();
        }
      } catch {
        redirectUrl = await fetchAdminHomePath();
      }
    } else {
      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl?.startsWith("/")) redirectUrl = callbackUrl;
    }

    router.replace(redirectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setErrors({});
    scrubAuthFlashParams();

    const result = loginBackendSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<LoginBackendData> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as keyof LoginBackendData;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.login({
        email: result.data.email,
        password: result.data.password,
      });

      if (response.success && response.data) {
        if (
          response.data.requires_admin_otp ||
          response.data.requires_device_otp
        ) {
          if (
            !response.data.challenge_id ||
            !response.data.email_hint ||
            !response.data.resend_available_at
          ) {
            showError("Could not start sign-in verification. Try again.");
            setIsSubmitting(false);
            return;
          }
          const initialInfo = response.data.reused_existing_otp
            ? "A verification code was already sent and is still valid. Check your email."
            : "Verification code sent. Check your email to complete sign-in.";
          setServerError("");
          setSuccessMessage("");
          setOtpStep({
            flow: response.data.requires_admin_otp ? "admin" : "device",
            challengeId: response.data.challenge_id,
            emailHint: response.data.email_hint,
            resendAvailableAt: response.data.resend_available_at,
            initialInfo,
          });
          setIsSubmitting(false);
          return;
        }

        if (!response.data.access_token || !response.data.user) {
          showError(
            response.message || "Invalid credentials. Please try again.",
          );
          setIsSubmitting(false);
          return;
        }

        await finishLogin(response.data.access_token, response.data.user);
      } else {
        showError(
          response.message || "Invalid credentials. Please try again.",
        );
        setIsSubmitting(false);
      }
    } catch (error: unknown) {
      showError(
        error instanceof Error
          ? error.message
          : "Invalid credentials. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dashboard-bg px-4 py-12">
      <AuthCard
        title={
          otpStep
            ? otpStep.flow === "device"
              ? "Confirm this device"
              : "Verify admin sign-in"
            : "Sign in to Smipay"
        }
        description={
          otpStep
            ? "Enter the code we emailed you to finish signing in."
            : "Welcome back. Sign in with your email."
        }
      >
        {otpStep ? (
          <AdminLoginOtpStep
            flow={otpStep.flow}
            challengeId={otpStep.challengeId}
            emailHint={otpStep.emailHint}
            resendAvailableAt={otpStep.resendAvailableAt}
            initialInfo={otpStep.initialInfo}
            onChallengeUpdate={(update) =>
              setOtpStep((prev) => (prev ? { ...prev, ...update } : prev))
            }
            onBack={() => {
              setOtpStep(null);
              setServerError("");
              setSuccessMessage("");
            }}
            onVerified={async (data) => {
              setIsSubmitting(true);
              setServerError("");
              setSuccessMessage("");
              try {
                await finishLogin(data.access_token, data.user);
              } catch (error: unknown) {
                skipAutoRedirect.current = false;
                setOtpStep(null);
                showError(
                  error instanceof Error
                    ? error.message
                    : "Sign-in failed. Please try again.",
                );
                setIsSubmitting(false);
              }
            }}
          />
        ) : (
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-5"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          {serverError ? (
            <FormError message={serverError} />
          ) : successMessage ? (
            <FormSuccess message={successMessage} />
          ) : null}

          <motion.div className="space-y-2" variants={fieldVariants}>
            <Label htmlFor="email" className="label-auth">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`input-auth ${errors.email ? "input-auth-error" : ""}`}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </motion.div>

          <motion.div className="space-y-2" variants={fieldVariants}>
            <Label htmlFor="password" className="label-auth">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              error={errors.password}
              autoComplete="current-password"
              className="input-auth"
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
            <p className="text-xs text-dashboard-muted">
              New accounts use a 6-digit password. If you signed up earlier, use your
              existing password — or reset it via{" "}
              <Link
                href="/auth/forgot-password"
                className="text-dashboard-accent hover:underline"
              >
                forgot password
              </Link>
              .
            </p>
          </motion.div>

          <motion.div className="flex items-center justify-end" variants={fieldVariants}>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-dashboard-accent hover:text-dashboard-accent/80 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </motion.div>

          <motion.div variants={fieldVariants}>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-medium shadow-md shadow-orange-900/10"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </motion.div>

          <motion.p
            className="text-center text-sm text-dashboard-muted"
            variants={fieldVariants}
          >
            Don&apos;t have an account?{" "}
            <Link
              href={
                WEB_REGISTRATION_ENABLED ? "/auth/register" : MOBILE_ONLY_PATH
              }
              className="text-dashboard-accent hover:underline font-medium"
            >
              {WEB_REGISTRATION_ENABLED ? "Create one" : "Get the app"}
            </Link>
          </motion.p>
        </motion.form>
        )}
      </AuthCard>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
          <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
