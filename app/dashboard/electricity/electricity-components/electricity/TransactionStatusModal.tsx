"use client";

import Image from "next/image";
import { X, CheckCircle2, Clock, AlertCircle, Loader2, Copy, Check, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { getNetworkLogo } from "@/lib/network-logos";
import { vtpassElectricityApi } from "@/services/vtpass/vtu/vtpass-electricity-api";
import type { VtpassElectricityPurchaseResponse } from "@/types/vtpass/vtu/vtpass-electricity";

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "processing" | "error";
  transactionData?: VtpassElectricityPurchaseResponse;
  errorMessage?: string;
  onRetry?: () => void;
  serviceID?: string;
  meterType?: "prepaid" | "postpaid";
  requestId?: string;
  onStatusUpdate?: (data: QueryResultData) => void;
}

interface QueryResultData {
  code: string;
  response_description: string;
  content?: {
    transactions: {
      status: string;
      product_name?: string;
      unique_element?: string;
      unit_price?: string | number;
      quantity?: number;
      commission?: number;
      transactionId?: string;
    };
  };
  requestId?: string;
  amount?: number;
  purchased_code?: string;
  electricity_token?: string;
  units?: string;
}

const POLL_INTERVALS = [15000, 30000, 30000, 45000, 60000, 60000, 60000, 60000, 60000, 60000];

export function TransactionStatusModal({
  isOpen,
  onClose,
  status,
  transactionData,
  errorMessage,
  onRetry,
  serviceID,
  meterType,
  requestId,
  onStatusUpdate,
}: TransactionStatusModalProps) {
  const [tokenCopied, setTokenCopied] = useState(false);
  const [txIdCopied, setTxIdCopied] = useState(false);
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
      const result = await vtpassElectricityApi.queryTransaction({ request_id: requestId });
      if (abortedRef.current) return;

      const data = result.data;
      const txStatus = data?.content?.transactions?.status;
      const code = data?.code;

      if (code === "000" && txStatus === "delivered") {
        setPollMessage("");
        setIsPolling(false);
        onStatusUpdate?.(data as unknown as QueryResultData);
        return;
      }

      if (code === "016" || code === "040" || txStatus === "failed" || txStatus === "reversed") {
        setPollMessage("");
        setIsPolling(false);
        onStatusUpdate?.(data as unknown as QueryResultData);
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

  // Auto-poll on processing status
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

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      abortedRef.current = true;
      clearPollTimer();
      setPollAttempt(0);
      setPollMessage("");
    }
  }, [isOpen, clearPollTimer]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleManualRefresh = () => {
    clearPollTimer();
    queryStatus();
  };

  const electricityToken = transactionData?.electricity_token;
  const units = transactionData?.units;
  const isPrepaid = meterType === "prepaid";
  const hasToken = isPrepaid && !!electricityToken;
  const transactionId =
    transactionData?.content?.transactions?.transactionId || transactionData?.requestId;
  const logo = serviceID ? getNetworkLogo(serviceID) : null;

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      title: hasToken ? "Electricity Token Ready!" : "Payment Successful!",
      description: hasToken
        ? "Your electricity token is below. Save it to load on your meter."
        : "Your electricity bill has been paid successfully.",
    },
    processing: {
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      title: "Processing",
      description: "Your payment is being processed. Please wait…",
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
        className="bg-dashboard-surface rounded-2xl shadow-xl max-w-md w-full border border-dashboard-border/80 overflow-hidden"
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
          {/* Electricity Token — prominent display for prepaid */}
          {status === "success" && hasToken && electricityToken && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-700" />
                <p className="text-xs font-semibold text-amber-800">Electricity Token</p>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                <span className="font-mono font-bold text-lg sm:text-xl text-amber-900 tracking-wider break-all">
                  {electricityToken}
                </span>
                <button
                  onClick={() => copyToClipboard(electricityToken, setTokenCopied)}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors ml-2 shrink-0"
                  title="Copy token"
                >
                  {tokenCopied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-amber-700" />
                  )}
                </button>
              </div>
              {units && (
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  Units: {units}
                </p>
              )}
              <p className="text-[10px] sm:text-xs text-amber-700 mt-1">
                Save this token. You need it to load electricity on your meter.
              </p>
            </div>
          )}

          {/* Success details */}
          {status === "success" && transactionData?.content?.transactions && (
            <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 space-y-3">
              {logo && (
                <div className="flex items-center gap-2.5 pb-3 border-b border-dashboard-border/60">
                  <div className="relative h-8 w-8 rounded-lg overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
                    <Image src={logo} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <span className="font-semibold text-sm text-dashboard-heading">
                    {transactionData.content.transactions.product_name}
                  </span>
                </div>
              )}
              {!logo && transactionData.content.transactions.product_name && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-dashboard-muted">Product</span>
                  <span className="font-semibold text-dashboard-heading">
                    {transactionData.content.transactions.product_name}
                  </span>
                </div>
              )}
              {transactionData.customerName && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                  <span className="text-dashboard-muted">Customer</span>
                  <span className="font-semibold text-dashboard-heading">
                    {transactionData.customerName}
                  </span>
                </div>
              )}
              {transactionData.content.transactions.unique_element && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                  <span className="text-dashboard-muted">Meter</span>
                  <span className="font-semibold text-dashboard-heading font-mono">
                    {transactionData.content.transactions.unique_element}
                  </span>
                </div>
              )}
              {transactionData.amount && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                  <span className="text-dashboard-muted">Amount</span>
                  <span className="font-bold text-dashboard-heading">
                    ₦{transactionData.amount.toLocaleString()}
                  </span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                  <span className="text-dashboard-muted">Transaction ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-dashboard-heading truncate max-w-[120px]">
                      {transactionId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(transactionId, setTxIdCopied)}
                      className="p-1 hover:bg-dashboard-border/40 rounded transition-colors shrink-0"
                    >
                      {txIdCopied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-dashboard-muted" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing info with polling status */}
          {status === "processing" && (
            <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 space-y-3">
              {logo && transactionData && (
                <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-dashboard-border/60">
                  <div className="relative h-7 w-7 rounded-lg overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
                    <Image src={logo} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <span className="font-medium text-sm text-dashboard-heading">
                    {transactionData.content?.transactions?.product_name ||
                      serviceID?.replace(/-/g, " ").toUpperCase()}
                  </span>
                </div>
              )}

              {requestId && (
                <div>
                  <p className="text-[10px] text-dashboard-muted">Request ID</p>
                  <p className="text-xs font-mono text-dashboard-heading break-all">{requestId}</p>
                </div>
              )}

              {/* Polling status */}
              <div className="flex items-center gap-2 pt-2 border-t border-dashboard-border/60">
                {isPolling ? (
                  <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                )}
                <p className="text-[11px] text-dashboard-muted flex-1">
                  {pollMessage || `Auto-checking in ${Math.ceil((POLL_INTERVALS[pollAttempt] ?? 60000) / 1000)}s…`}
                </p>
              </div>

              {pollAttempt >= POLL_INTERVALS.length && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg">
                  Your transaction is still processing. Please check your transaction history for updates, or contact support.
                </p>
              )}

              {/* Manual refresh button */}
              {requestId && (
                <Button
                  type="button"
                  onClick={handleManualRefresh}
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

          {/* Error info */}
          {status === "error" && errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
              <p className="text-xs sm:text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
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
