"use client";

import Image from "next/image";
import { X, CheckCircle2, Clock, AlertCircle, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getNetworkLogo } from "@/lib/network-logos";
import type { VtpassCablePurchaseResponse } from "@/types/vtpass/vtu/vtpass-cable";

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "processing" | "error";
  transactionData?: VtpassCablePurchaseResponse;
  errorMessage?: string;
  onRetry?: () => void;
  serviceID?: string;
}

export function TransactionStatusModal({
  isOpen,
  onClose,
  status,
  transactionData,
  errorMessage,
  onRetry,
  serviceID,
}: TransactionStatusModalProps) {
  const [copied, setCopied] = useState(false);
  const [voucherCopied, setVoucherCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const voucherCode = transactionData?.voucher_code || transactionData?.purchased_code || transactionData?.Voucher?.[0];
  const isShowmax = !!voucherCode;
  const transactionId = transactionData?.content?.transactions?.transactionId || transactionData?.requestId;
  const logo = serviceID ? getNetworkLogo(serviceID) : null;

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      title: isShowmax ? "Showmax Subscription Ready!" : "Subscription Activated!",
      description: isShowmax
        ? "Your voucher code is below. Save it to activate your Showmax."
        : "Your cable TV subscription has been successfully activated.",
    },
    processing: {
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      title: "Processing",
      description: "Your transaction is being processed. You can close this and check back later.",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      title: "Transaction Failed",
      description: errorMessage || "Something went wrong. Your wallet has been refunded if charged.",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
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
          {/* Success details */}
          {status === "success" && transactionData?.content?.transactions && (
            <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 space-y-3">
              {/* Provider with logo */}
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
              {!logo && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-dashboard-muted">Product</span>
                  <span className="font-semibold text-dashboard-heading">
                    {transactionData.content.transactions.product_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                <span className="text-dashboard-muted">{isShowmax ? "Phone" : "Smartcard"}</span>
                <span className="font-semibold text-dashboard-heading font-mono">
                  {transactionData.content.transactions.unique_element}
                </span>
              </div>
              {transactionData.content.transactions.amount && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                  <span className="text-dashboard-muted">Amount</span>
                  <span className="font-bold text-dashboard-heading">
                    ₦{parseFloat(String(transactionData.content.transactions.amount)).toLocaleString()}
                  </span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashboard-border/60">
                  <span className="text-dashboard-muted">Transaction ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-dashboard-heading truncate max-w-[120px]">{transactionId}</span>
                    <button
                      onClick={() => copyToClipboard(transactionId, setCopied)}
                      className="p-1 hover:bg-dashboard-border/40 rounded transition-colors shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-dashboard-muted" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Showmax Voucher */}
          {status === "success" && isShowmax && voucherCode && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">Showmax Voucher Code</p>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                <span className="font-mono font-bold text-lg text-amber-900 tracking-wider">{voucherCode}</span>
                <button
                  onClick={() => copyToClipboard(voucherCode, setVoucherCopied)}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors ml-2 shrink-0"
                >
                  {voucherCopied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-amber-700" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-amber-700 mt-2">
                Save this code. You need it to activate your Showmax subscription.
              </p>
            </div>
          )}

          {/* Processing info */}
          {status === "processing" && transactionData && (
            <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4">
              {logo && (
                <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-dashboard-border/60">
                  <div className="relative h-7 w-7 rounded-lg overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
                    <Image src={logo} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <span className="font-medium text-sm text-dashboard-heading">
                    {transactionData.content?.transactions?.product_name || serviceID?.toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-xs text-dashboard-muted mb-1">
                <strong className="text-dashboard-heading">Request ID:</strong> {transactionData.requestId}
              </p>
              <p className="text-[10px] text-dashboard-muted mt-2">
                You can close this and continue. Check your transaction history for updates.
              </p>
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
              className={`${status === "error" && onRetry ? "flex-1" : "w-full"} rounded-xl h-11 bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-semibold`}
            >
              {status === "processing" ? "Close" : "Done"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
