"use client";

import { X, CheckCircle2, Clock, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { vtpassInternationalAirtimeApi } from "@/services/vtpass/vtu/vtpass-international-airtime-api";
import type {
  IntlAirtimePurchaseResponse,
  IntlAirtimeQueryResponse,
} from "@/types/vtpass/vtu/vtpass-international-airtime";

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "processing" | "error";
  transactionData?: IntlAirtimePurchaseResponse;
  errorMessage?: string;
  onRetry?: () => void;
  requestId?: string;
  onStatusUpdate?: (data: IntlAirtimeQueryResponse["data"]) => void;
}

const POLL_INTERVALS = [15000, 30000, 30000, 45000, 60000, 60000, 60000, 60000, 60000, 60000];

export function TransactionStatusModal({
  isOpen,
  onClose,
  status,
  transactionData,
  errorMessage,
  onRetry,
  requestId,
  onStatusUpdate,
}: TransactionStatusModalProps) {
  const [pollAttempt, setPollAttempt] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [pollMessage, setPollMessage] = useState("");
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortedRef = useRef(false);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const queryStatus = useCallback(async () => {
    if (!requestId || abortedRef.current) return;
    setIsPolling(true);
    setPollMessage("Checking transaction status…");

    try {
      const result = await vtpassInternationalAirtimeApi.queryTransaction({ request_id: requestId });
      if (abortedRef.current) return;

      const data = result.data;
      const txStatus = data?.content?.transactions?.status;
      const code = data?.code;

      if (code === "000" && txStatus === "delivered") {
        setPollMessage("");
        setIsPolling(false);
        onStatusUpdate?.(data);
        return;
      }

      if (code === "016" || code === "040" || txStatus === "failed" || txStatus === "reversed") {
        setPollMessage("");
        setIsPolling(false);
        onStatusUpdate?.(data);
        return;
      }

      setPollAttempt((prev) => prev + 1);
      setIsPolling(false);
      setPollMessage("Still processing. Will check again shortly…");
    } catch {
      if (!abortedRef.current) {
        setIsPolling(false);
        setPollMessage("Could not check status. Will retry…");
        setPollAttempt((prev) => prev + 1);
      }
    }
  }, [requestId, onStatusUpdate]);

  useEffect(() => {
    if (status !== "processing" || !requestId) return;
    abortedRef.current = false;

    if (pollAttempt >= POLL_INTERVALS.length) {
      setPollMessage("Your transaction is still processing. Please check your transaction history for updates.");
      return;
    }

    const delay = POLL_INTERVALS[pollAttempt] ?? 60000;
    pollTimerRef.current = setTimeout(() => {
      if (!abortedRef.current) queryStatus();
    }, delay);

    return () => clearPollTimer();
  }, [status, requestId, pollAttempt, queryStatus, clearPollTimer]);

  useEffect(() => {
    if (!isOpen) {
      abortedRef.current = true;
      clearPollTimer();
      setPollAttempt(0);
      setPollMessage("");
    }
  }, [isOpen, clearPollTimer]);

  if (!isOpen) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      title: "Top Up Successful!",
      description: "Your international airtime was credited successfully.",
    },
    processing: {
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      title: "Processing",
      description: "Your transaction is being processed. Please wait…",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      title: "Transaction Failed",
      description:
        errorMessage || "Something went wrong. Your wallet has been refunded if charged.",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-dashboard-surface rounded-2xl shadow-xl max-w-md w-full border border-dashboard-border/80 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${config.bgColor} p-6 text-center relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/40 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-dashboard-muted" />
          </button>
          <div className="flex justify-center mb-3">
            {status === "processing" ? (
              <Loader2 className={`h-12 w-12 ${config.iconColor} animate-spin`} />
            ) : (
              <Icon className={`h-12 w-12 ${config.iconColor}`} />
            )}
          </div>
          <h2 className="text-lg font-bold text-dashboard-heading mb-1">{config.title}</h2>
          <p className="text-xs sm:text-sm text-dashboard-muted">{config.description}</p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {status === "success" && transactionData?.content?.transactions && (
            <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-dashboard-muted">Product</span>
                <span className="font-semibold text-dashboard-heading text-right">
                  {transactionData.content.transactions.product_name}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                <span className="text-dashboard-muted">Destination</span>
                <span className="font-mono text-dashboard-heading text-right">
                  {transactionData.content.transactions.unique_element}
                </span>
              </div>
              {transactionData.amount && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                  <span className="text-dashboard-muted">Amount</span>
                  <span className="font-bold text-dashboard-heading">
                    ₦{transactionData.amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {status === "processing" && (
            <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 space-y-3">
              {requestId && (
                <div>
                  <p className="text-[10px] text-dashboard-muted">Request ID</p>
                  <p className="text-xs font-mono text-dashboard-heading break-all">{requestId}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-dashboard-border/60">
                {isPolling ? (
                  <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                )}
                <p className="text-[11px] text-dashboard-muted flex-1">
                  {pollMessage ||
                    `Auto-checking in ${Math.ceil((POLL_INTERVALS[pollAttempt] ?? 60000) / 1000)}s…`}
                </p>
              </div>

              {pollAttempt >= POLL_INTERVALS.length && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg">
                  Your transaction is still processing. Please check your transaction history for
                  updates, or contact support.
                </p>
              )}

              {requestId && (
                <Button
                  type="button"
                  onClick={() => {
                    clearPollTimer();
                    queryStatus();
                  }}
                  disabled={isPolling}
                  variant="outline"
                  className="w-full h-9 rounded-xl text-xs font-semibold border-dashboard-border gap-2"
                >
                  {isPolling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {isPolling ? "Checking…" : "Refresh Status"}
                </Button>
              )}
            </div>
          )}

          {status === "error" && errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
              <p className="text-xs sm:text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {status === "error" && onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                className="flex-1 rounded-xl h-11 border-dashboard-border text-dashboard-heading hover:bg-dashboard-bg"
              >
                Try Again
              </Button>
            )}
            <Button
              onClick={onClose}
              className={`${
                status === "error" && onRetry ? "flex-1" : "w-full"
              } rounded-xl h-11 bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-semibold`}
            >
              {status === "processing" ? "Close" : "Done"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

