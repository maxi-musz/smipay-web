"use client";

import { useEffect } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionWarningProps {
  showWarning: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionWarning({
  showWarning,
  timeRemaining,
  onExtend,
  onLogout,
}: SessionWarningProps) {
  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Prevent body scroll when warning is shown
  useEffect(() => {
    if (showWarning) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />

      {/* Warning Dialog */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-[9999] sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full px-5 py-5 sm:p-6 max-h-[90dvh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
          {/* Icon */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
              Session Expiring Soon
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              For your security, you&apos;ll be automatically logged out due to inactivity.
            </p>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 bg-orange-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-2xl sm:text-3xl font-mono font-bold text-orange-600">
                {formatTime(timeRemaining)}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500">
              Click &quot;Stay Logged In&quot; to continue your session
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <Button
              onClick={onExtend}
              className="w-full bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white"
            >
              Stay Logged In
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Logout Now
            </Button>
          </div>

          {/* Security Note */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <p className="text-[11px] sm:text-xs text-gray-500 text-center">
              <span className="font-semibold">Security Notice:</span> This session timeout
              protects your financial information when you&apos;re away from your device.
            </p>
          </div>

          {/* Safe area spacer for mobile */}
          <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
        </div>
      </div>
    </>
  );
}

