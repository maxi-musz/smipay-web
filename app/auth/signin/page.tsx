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
import { loginBackendSchema, type LoginBackendData } from "@/lib/validations/auth/login-backend.schema";
import { authApi } from "@/services/auth-api";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Phone } from "lucide-react";

type LoginMode = "email" | "phone";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>("email");
  const [formData, setFormData] = useState<LoginBackendData>({
    email: "",
    phone_number: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginBackendData>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check for messages from URL params
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Registration successful! Please sign in to continue.");
    }

    if (searchParams.get("reset") === "true") {
      setSuccessMessage("Password reset successfully. Please sign in with your new password.");
    }

    // Check if session expired
    if (searchParams.get("expired") === "true") {
      const message = searchParams.get("message");
      setServerError(message || "Your session has expired. Please sign in again.");
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

    // Prepare data based on login mode
    const loginData: LoginBackendData = {
      email: loginMode === "email" ? formData.email : "",
      phone_number: loginMode === "phone" ? formData.phone_number : "",
      password: formData.password,
    };

    // Validate with Zod
    const result = loginBackendSchema.safeParse(loginData);

    if (!result.success) {
      const fieldErrors: Partial<LoginBackendData> = {};
      result.error.issues.forEach((error) => {
        const path = error.path[0] as keyof LoginBackendData;
        fieldErrors[path] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login({
        email: result.data.email || undefined,
        phone_number: result.data.phone_number || undefined,
        password: result.data.password,
      });

      if (response.success && response.data) {
        // Save token and user data
        login(response.data.user, response.data.access_token);

        setSuccessMessage("Login successful! Redirecting...");
        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 1000);
      }
    } catch (error: any) {
      setServerError(error.message || "Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  const switchLoginMode = () => {
    setLoginMode((prev) => (prev === "email" ? "phone" : "email"));
    setFormData({ email: "", phone_number: "", password: formData.password });
    setErrors({});
    setServerError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <AuthCard
        title="Sign In to Smipay"
        description="Welcome back! Sign in to your account to continue"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {successMessage && <FormSuccess message={successMessage} />}
          {serverError && <FormError message={serverError} />}

          {/* Login Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setLoginMode("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === "email"
                  ? "bg-white text-brand-bg-primary shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-text-primary"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === "phone"
                  ? "bg-white text-brand-bg-primary shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-text-primary"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
          </div>

          {/* Email Login */}
          {loginMode === "email" && (
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
          )}

          {/* Phone Login */}
          {loginMode === "phone" && (
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
          )}

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              error={errors.password}
              autoComplete="current-password"
            />
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            <p className="text-xs text-brand-text-secondary">
              New accounts use a 6-digit password. If you signed up earlier, use your
              existing password — or reset it via{" "}
              <Link
                href="/auth/forgot-password"
                className="text-brand-bg-primary hover:underline"
              >
                forgot password
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-brand-bg-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-bg-primary hover:bg-brand-bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center text-sm text-brand-text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-brand-bg-primary hover:underline font-medium"
            >
              Create one
            </Link>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-bg-primary" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}


