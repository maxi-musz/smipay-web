"use client";

import { useAuthStore } from "@/store/auth-store-backend";
import { useEffect } from "react";
import { isPaymentInProgress } from "@/lib/auth-storage";

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setLoading,
    setError,
    clearError,
    initializeAuth,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    // If payment is in progress, don't redirect to login
    if (isPaymentInProgress()) {
      setLoading(false);
      return;
    }
    
    initializeAuth();
  }, [initializeAuth, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setLoading,
    setError,
    clearError,
    initializeAuth,
  };
}

