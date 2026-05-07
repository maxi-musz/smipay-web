"use client";

import { X, CheckCircle2, Clock, AlertCircle, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { VtpassPurchaseResponse } from "@/services/vtpass/vtu/vtpass-airtime-api";

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "processing" | "error";
  transactionData?: VtpassPurchaseResponse;
  errorMessage?: string;
  onRetry?: () => void;
}

export function TransactionStatusModal({
  isOpen,
  onClose,
  status,
  transactionData,
  errorMessage,
  onRetry,
}: TransactionStatusModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyTransactionId = () => {
    if (transactionData?.content?.transactions?.transactionId) {
      navigator.clipboard.writeText(
        transactionData.content.transactions.transactionId
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "Airtime Purchase Successful!",
          description: "Your airtime has been successfully credited to the phone number.",
        };
      case "processing":
        return {
          icon: Clock,
          iconColor: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "Transaction Processing",
          description:
            "Your transaction is being processed. This may take a few minutes. You'll receive a notification once it's completed. You don't need to wait on this page.",
        };
      case "error":
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "Transaction Failed",
          description: "An error occurred while processing your transaction.",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;
  const transactionId =
    transactionData?.content?.transactions?.transactionId ||
    transactionData?.requestId;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-dashboard-surface rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full ${config.borderColor} border-2 overflow-hidden max-h-[90dvh] sm:max-h-[85vh] flex flex-col`}
      >
        <div className={`${config.bgColor} p-5 sm:p-6 text-center relative shrink-0`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 -m-2 rounded-full hover:bg-black/10 transition-colors text-dashboard-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex justify-center mb-3 sm:mb-4">
            {status === "processing" ? (
              <Loader2 className={`h-12 w-12 sm:h-16 sm:w-16 ${config.iconColor} animate-spin`} />
            ) : (
              <Icon className={`h-12 w-12 sm:h-16 sm:w-16 ${config.iconColor}`} />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-dashboard-heading mb-1.5 sm:mb-2">
            {config.title}
          </h2>
          <p className="text-xs sm:text-sm text-dashboard-muted">{config.description}</p>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {status === "success" && transactionData?.content?.transactions && (
            <div className="space-y-3 bg-dashboard-bg/60 rounded-xl border border-dashboard-border/80 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-dashboard-muted">Phone</span>
                <span className="font-semibold text-sm text-dashboard-heading">
                  {transactionData.content.transactions.unique_element}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-dashboard-muted">Amount</span>
                <span className="font-semibold text-sm text-dashboard-heading">
                  ₦{parseFloat(transactionData.content.transactions.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-dashboard-muted">Product</span>
                <span className="font-semibold text-sm text-dashboard-heading truncate max-w-[180px]">
                  {transactionData.content.transactions.product_name}
                </span>
              </div>
              {transactionId && (
                <div className="flex justify-between items-center gap-2 pt-3 border-t border-dashboard-border/80">
                  <span className="text-xs text-dashboard-muted">Transaction ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] sm:text-xs text-dashboard-heading">
                      {transactionId.slice(0, 12)}…
                    </span>
                    <button
                      onClick={copyTransactionId}
                      className="p-2 -m-2 rounded-lg hover:bg-dashboard-border/60 transition-colors"
                      title="Copy transaction ID"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-[var(--tx-success-text)]" />
                      ) : (
                        <Copy className="h-4 w-4 text-dashboard-muted" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === "processing" && transactionData && (
            <div className="space-y-3 bg-dashboard-bg/60 rounded-xl border border-dashboard-border/80 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-dashboard-muted">Request ID</span>
                <span className="font-mono text-[10px] sm:text-xs text-dashboard-heading break-all">
                  {transactionData.requestId}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-dashboard-muted">Amount</span>
                <span className="font-semibold text-sm text-dashboard-heading">
                  ₦{transactionData.amount.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/50 p-3 mt-3">
                <p className="text-xs text-dashboard-muted">
                  You can close this and keep using the app. We’ll notify you when it’s done.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
              <p className="text-xs sm:text-sm text-red-800">{errorMessage || config.description}</p>
              {errorMessage?.includes("Insufficient") && (
                <Button
                  onClick={() => {
                    onClose();
                    window.location.href = "/dashboard";
                  }}
                  className="mt-3 w-full min-h-12 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90"
                >
                  Fund Wallet
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0">
            {status === "error" && onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                className="flex-1 min-h-12 rounded-xl border-dashboard-border touch-manipulation"
              >
                Try again
              </Button>
            )}
            <Button
              onClick={onClose}
              className="flex-1 min-h-12 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 touch-manipulation"
            >
              {status === "processing" ? "Close & continue" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
