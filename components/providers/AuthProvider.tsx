"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store-backend";
import { initGeolocation } from "@/lib/device-metadata";

/**
 * Auth provider that initializes authentication state
 * and starts geolocation tracking (§4 FRONTEND_DEVICE_METADATA.md).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
    initGeolocation();
  }, [initializeAuth]);

  return <>{children}</>;
}

