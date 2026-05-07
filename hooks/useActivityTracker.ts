"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store-backend";
import {
  updateLastActivity,
  isSessionExpired,
  getTimeUntilExpiry,
  SESSION_WARNING_TIME,
  clearAuth,
} from "@/lib/auth-storage";

/**
 * Activity Tracker Hook
 * Monitors user activity and automatically logs out after inactivity.
 * When session expires: silently clears auth, freezes page, shows expired modal.
 * User must acknowledge before being redirected to sign-in.
 */
export function useActivityTracker() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleActivity = useCallback(() => {
    if (isAuthenticated && !sessionExpired) {
      updateLastActivity();
      setShowWarning(false);
    }
  }, [isAuthenticated, sessionExpired]);

  const silentLogout = useCallback(() => {
    clearAuth();
    logout();
    setShowWarning(false);
    setSessionExpired(true);
  }, [logout]);

  const handleLogout = useCallback((message?: string) => {
    clearAuth();
    logout();

    // Redirect to landing page instead of signin.
    // We intentionally drop the \"session expired\" query so users just see home.
    if (message) {
      console.info(message);
    }
    router.push("/");
  }, [logout, router]);

  const acknowledgeExpiry = useCallback(() => {
    router.push("/");
  }, [router]);

  const checkSession = useCallback(() => {
    if (!isAuthenticated || sessionExpired) return;

    if (isSessionExpired()) {
      silentLogout();
      return;
    }

    const timeLeft = getTimeUntilExpiry();
    setTimeRemaining(Math.ceil(timeLeft / 1000));

    if (timeLeft <= SESSION_WARNING_TIME && timeLeft > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [isAuthenticated, sessionExpired, silentLogout]);

  const extendSession = useCallback(() => {
    updateLastActivity();
    setShowWarning(false);
  }, []);

  useEffect(() => {
    if ((!isAuthenticated && !sessionExpired) || sessionExpired) {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
      return;
    }

    const events = [
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    let lastUpdate = 0;
    const throttleTime = 5000;

    const throttledHandleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate >= throttleTime) {
        lastUpdate = now;
        handleActivity();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandleActivity);
    });

    checkIntervalRef.current = setInterval(checkSession, 10000);

    warningIntervalRef.current = setInterval(() => {
      if (showWarning) {
        const timeLeft = getTimeUntilExpiry();
        setTimeRemaining(Math.ceil(timeLeft / 1000));

        if (timeLeft <= 0) {
          silentLogout();
        }
      }
    }, 1000);

    queueMicrotask(() => checkSession());

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandleActivity);
      });
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
    };
  }, [isAuthenticated, sessionExpired, handleActivity, checkSession, showWarning, silentLogout]);

  return {
    showWarning,
    sessionExpired,
    timeRemaining,
    extendSession,
    handleLogout,
    acknowledgeExpiry,
  };
}

