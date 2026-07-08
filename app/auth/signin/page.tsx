"use client";

import { useState, useEffect, Suspense } from "react";
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
import { mapNewAuthUserToUser } from "@/lib/auth-storage";
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
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginBackendData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginBackendData>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      const msg = "Registration successful! Please sign in to continue.";
      queueMicrotask(() => setSuccessMessage(msg));
    }
    if (searchParams.get("reset") === "true") {
      const msg = "Password reset successfully. Please sign in with your new password.";
      queueMicrotask(() => setSuccessMessage(msg));
    }
    if (searchParams.get("expired") === "true") {
      const message = searchParams.get("message");
      const err =
        message || "Your session has expired. Please sign in again.";
      queueMicrotask(() => setServerError(err));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginBackendData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

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

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email: result.data.email,
        password: result.data.password,
      });

      if (response.success && response.data) {
        const { access_token, user: apiUser } = response.data;
        const user = mapNewAuthUserToUser(apiUser);
        login(user, access_token);
        setSuccessMessage("Login successful! Redirecting...");
        let redirectUrl = "/dashboard";
        if (user.role && user.role !== "user") {
          redirectUrl = "/";
        } else {
          const callbackUrl = searchParams.get("callbackUrl");
          if (callbackUrl) redirectUrl = callbackUrl;
        }
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 1000);
      } else {
        setServerError(
          response.message || "Invalid credentials. Please try again."
        );
        setIsLoading(false);
      }
    } catch (error: unknown) {
      setServerError(
        error instanceof Error ? error.message : "Invalid credentials. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dashboard-bg px-4 py-12">
      <AuthCard
        title="Sign in to Smipay"
        description="Welcome back. Sign in with your email."
      >
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-5"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          {successMessage && <FormSuccess message={successMessage} />}
          {serverError && <FormError message={serverError} />}

          <motion.div className="space-y-2" variants={fieldVariants}>
            <Label htmlFor="email" className="label-auth">Email address</Label>
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
          </motion.div>

          <motion.div className="space-y-2" variants={fieldVariants}>
            <Label htmlFor="password" className="label-auth">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
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
              disabled={isLoading}
            >
              {isLoading ? (
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
              href="/auth/register"
              className="text-dashboard-accent hover:underline font-medium"
            >
              Create one
            </Link>
          </motion.p>
        </motion.form>
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
