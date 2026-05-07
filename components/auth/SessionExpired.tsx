"use client";

import { useEffect } from "react";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionExpiredProps {
  show: boolean;
  onAcknowledge: () => void;
}

export function SessionExpired({ show, onAcknowledge }: SessionExpiredProps) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]" />

      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
              <ShieldOff className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Session Expired
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              You&apos;ve been inactive for too long and have been securely
              logged out to protect your account.
            </p>
          </div>

          <Button
            onClick={onAcknowledge}
            className="w-full bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white h-11 text-sm font-semibold"
          >
            OK
          </Button>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              For your security, sessions are automatically ended after a period
              of inactivity. Please sign in again to continue.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
