"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Ban } from "lucide-react";
import { walletApi } from "@/services/wallet-api";

interface PaymentVerificationProps {
  reference: string;
  onSuccess: (data: { amount: string; balance_after?: string }) => void;
  onError: (message: string) => void;
  onRetry: () => void;
  onDismiss?: () => void;
}

type VerificationState = "verifying" | "success" | "failed" | "cancelled" | "error";

export function PaymentVerification({
  reference,
  onSuccess,
  onError,
  onRetry,
  onDismiss,
}: PaymentVerificationProps) {
  const [state, setState] = useState<VerificationState>("verifying");
  const [message, setMessage] = useState<string>("");
  const [verificationData, setVerificationData] = useState<{
    amount: string;
    balance_after?: string;
  } | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const verify = useCallback(async (ref: string, signal: AbortSignal) => {
    const maxRetries = 3;
    const retryDelay = 2000;
    let retryCount = 0;

    const attempt = async (): Promise<void> => {
      if (signal.aborted) return;

      try {
        const response = await walletApi.verifyPaystackFunding(ref);
        if (signal.aborted) return;

        const dataStatus = response.data?.status?.toLowerCase();

        // Backend docs: success:true + data.status:"success" = wallet credited
        if (response.success && dataStatus === "success" && response.data) {
          setState("success");
          setMessage(response.message);
          setVerificationData({
            amount: response.data.amount ?? "0",
            balance_after: response.data.balance_after,
          });
          onSuccessRef.current({
            amount: response.data.amount ?? "0",
            balance_after: response.data.balance_after,
          });
          return;
        }

        // Backend docs: success:false + data.status:"cancelled" = user cancelled on Payment Provider
        if (dataStatus === "cancelled" || dataStatus === "abandoned") {
          setState("cancelled");
          setMessage(response.message || "You cancelled this payment on the checkout page.");
          onErrorRef.current("Payment was cancelled");
          return;
        }

        // Backend docs: success:false + data.status:"failed" = card declined etc.
        if (dataStatus === "failed") {
          setState("failed");
          setMessage(response.message || "Payment failed");
          onErrorRef.current(response.message || "Payment failed");
          return;
        }

        // Any other non-success response (validation errors, not found, etc.)
        setState("failed");
        setMessage(response.message || "Payment verification failed");
        onErrorRef.current(response.message || "Payment verification failed");
      } catch (error) {
        if (signal.aborted) return;

        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise((r) => setTimeout(r, retryDelay));
          if (!signal.aborted) return attempt();
        } else {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to verify payment";
          setState("error");
          setMessage(errorMessage);
          onErrorRef.current(errorMessage);
        }
      }
    };

    await attempt();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    verify(reference, controller.signal);
    return () => controller.abort();
  }, [reference, verify]);

  return (
    <div className="space-y-6 py-2">
      {/* Status Icon */}
      <div className="flex justify-center">
        {state === "verifying" && (
          <div className="p-4 bg-blue-100 rounded-full">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        )}
        {state === "success" && (
          <div className="p-4 bg-emerald-100 rounded-full ring-4 ring-emerald-100/50">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
        )}
        {state === "cancelled" && (
          <div className="p-4 bg-slate-100 rounded-full">
            <Ban className="h-12 w-12 text-slate-500" />
          </div>
        )}
        {state === "failed" && (
          <div className="p-4 bg-red-100 rounded-full">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        )}
        {state === "error" && (
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-amber-600" />
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="text-center">
        {state === "verifying" && (
          <>
            <h3 className="text-xl font-semibold text-dashboard-heading mb-2">
              Verifying payment
            </h3>
            <p className="text-sm text-dashboard-muted">
              Please wait while we confirm your payment...
            </p>
          </>
        )}
        {state === "success" && (
          <>
            <h3 className="text-xl font-semibold text-emerald-700 mb-1">
              Payment successful
            </h3>
            <p className="text-sm text-dashboard-muted mb-5">
              Your wallet has been credited.
            </p>
            {verificationData && (
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-5 text-left">
                <p className="text-xs font-medium text-emerald-800/80 uppercase tracking-wider mb-1">
                  Amount credited
                </p>
                <p className="text-2xl font-bold text-emerald-800 tabular-nums">
                  ₦{verificationData.amount}
                </p>
                {verificationData.balance_after && (
                  <p className="text-sm text-emerald-700/90 mt-2 pt-2 border-t border-emerald-200/60">
                    New balance: <span className="font-semibold tabular-nums">₦{verificationData.balance_after}</span>
                  </p>
                )}
              </div>
            )}
          </>
        )}
        {state === "cancelled" && (
          <>
            <h3 className="text-xl font-semibold text-dashboard-heading mb-2">
              Payment cancelled
            </h3>
            <p className="text-sm text-dashboard-muted">{message}</p>
            <p className="text-xs text-dashboard-muted mt-2">
              No charges were made. You can try again whenever you&apos;re ready.
            </p>
          </>
        )}
        {state === "failed" && (
          <>
            <h3 className="text-xl font-semibold text-red-700 mb-2">
              Payment failed
            </h3>
            <p className="text-sm text-dashboard-muted">{message}</p>
          </>
        )}
        {state === "error" && (
          <>
            <h3 className="text-xl font-semibold text-amber-700 mb-2">
              Verification error
            </h3>
            <p className="text-sm text-dashboard-muted mb-2">{message}</p>
            <p className="text-xs text-dashboard-muted">
              We couldn&apos;t verify your payment. Please try again or contact support.
            </p>
          </>
        )}
      </div>

      {/* Additional Information - verifying only */}
      {state === "verifying" && (
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-sm text-dashboard-muted">
          <p className="font-medium text-dashboard-heading mb-1.5">What&apos;s happening?</p>
          <ul className="space-y-1 text-xs">
            <li>Confirming your Deposit</li>
            <li>Updating your wallet balance</li>
            <li>Recording transaction</li>
          </ul>
        </div>
      )}

      {/* Success: Transaction reference + Done */}
      {state === "success" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-dashboard-bg/60 border border-dashboard-border/50 px-4 py-3">
            <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wider mb-1">
              Transaction reference
            </p>
            <p className="text-xs font-mono text-dashboard-heading break-all leading-relaxed">
              {reference}
            </p>
          </div>
          {onDismiss && (
            <Button
              type="button"
              onClick={onDismiss}
              className="w-full h-12 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-semibold"
            >
              Done
            </Button>
          )}
        </div>
      )}

      {/* Action Buttons - cancelled / failed / error */}
      {state === "cancelled" && (
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onRetry}
            className="flex-1 h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90"
          >
            Try again
          </Button>
          {onDismiss && (
            <Button
              type="button"
              variant="outline"
              onClick={onDismiss}
              className="flex-1 h-11 rounded-xl border-dashboard-border text-dashboard-heading"
            >
              Close
            </Button>
          )}
        </div>
      )}

      {(state === "failed" || state === "error") && (
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onRetry}
            className="flex-1 h-11 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90"
          >
            Try again
          </Button>
          {onDismiss && (
            <Button
              type="button"
              variant="outline"
              onClick={onDismiss}
              className="flex-1 h-11 rounded-xl border-dashboard-border text-dashboard-heading"
            >
              Close
            </Button>
          )}
        </div>
      )}

      {state === "verifying" && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="w-full text-center text-xs text-dashboard-muted hover:text-dashboard-heading transition-colors py-2"
        >
          Close — your payment will still be processed
        </button>
      )}

      {/* Reference for non-success states (for support) */}
      {state !== "success" && state !== "verifying" && (
        <div className="pt-2 border-t border-dashboard-border/50">
          <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wider mb-0.5">
            Reference
          </p>
          <p className="text-xs font-mono text-dashboard-heading break-all">
            {reference}
          </p>
        </div>
      )}
    </div>
  );
}
