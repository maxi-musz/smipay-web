"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Building2, CreditCard, Tag, ArrowLeft, Copy, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFundingAmount } from "./CardFundingAmount";
import { PaymentVerification } from "./PaymentVerification";
import { walletApi } from "@/services/wallet-api";
import {
  setPaymentInProgress,
  clearPaymentInProgress,
  savePaymentReference,
  clearPaymentReference,
} from "@/lib/auth-storage";
import type { BankAccount } from "@/types/dashboard";

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  initialReference?: string | null;
}

type FundingMethod = "bank-transfer" | "card" | "smipay-tag";
type Step = "select-method" | "bank-transfer" | "card-funding" | "card-verification" | "smipay-tag";

export function FundWalletModal({ 
  isOpen, 
  onClose, 
  bankAccounts, 
  initialReference = null 
}: FundWalletModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("select-method");
  const [selectedMethod, setSelectedMethod] = useState<FundingMethod | null>(null);
  void selectedMethod;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(initialReference);
  const [error, setError] = useState<string | null>(null);
  const [verificationDone, setVerificationDone] = useState(false);
  const verificationAbortRef = useRef(false);

  const primaryAccount = bankAccounts[0];

  useEffect(() => {
    if (initialReference && isOpen) {
      queueMicrotask(() => {
        setPaymentReference(initialReference);
        setCurrentStep("card-verification");
        setIsProcessing(false); // Coming back from Paystack — not "processing" anymore
      });
    }
  }, [initialReference, isOpen]);

  const handleMethodSelect = (method: FundingMethod) => {
    setSelectedMethod(method);
    if (method === "bank-transfer") {
      setCurrentStep("bank-transfer");
    } else if (method === "card") {
      setCurrentStep("card-funding");
    } else {
      setCurrentStep("smipay-tag");
    }
  };

  const handleBack = () => {
    if (currentStep === "card-verification") return;
    setCurrentStep("select-method");
    setSelectedMethod(null);
    setError(null);
  };

  const handleClose = () => {
    if (isProcessing) return;

    const wasVerifying = currentStep === "card-verification" && !verificationDone;

    if (wasVerifying && paymentReference) {
      verificationAbortRef.current = true;
      walletApi.cancelPaystackFunding(paymentReference).catch(() => {});
    }

    clearPaymentInProgress();
    clearPaymentReference();

    setCurrentStep("select-method");
    setSelectedMethod(null);
    setCopiedField(null);
    setPaymentReference(null);
    setError(null);
    setIsProcessing(false);
    setVerificationDone(false);
    verificationAbortRef.current = false;
    onClose();
  };

  const handleCardFundingContinue = async (amount: number) => {
    setIsProcessing(true);
    setError(null);

    try {
      const callbackUrl = `${window.location.origin}/dashboard?payment=callback`;
      const response = await walletApi.initializePaystackFunding(callbackUrl, amount);

      if (response.success && response.data) {
        setPaymentReference(response.data.reference);
        savePaymentReference(response.data.reference);
        setPaymentInProgress();
        window.location.href = response.data.authorization_url;
      } else {
        setError(response.message || "Failed to initialize payment");
        setIsProcessing(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleCardFundingCancel = () => {
    setCurrentStep("select-method");
    setSelectedMethod(null);
    setError(null);
  };

  const handleVerificationSuccess = useCallback((_data: { amount: string; balance_after?: string }) => {
    clearPaymentInProgress();
    clearPaymentReference();
    setVerificationDone(true);
  }, []);

  const handleVerificationError = useCallback((_message: string) => {
    clearPaymentInProgress();
    clearPaymentReference();
    setVerificationDone(true);
  }, []);

  const handleVerificationRetry = () => {
    clearPaymentInProgress();
    clearPaymentReference();
    setCurrentStep("card-funding");
    setPaymentReference(null);
    setError(null);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Modal — bottom sheet on mobile, centered on sm+ */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={handleClose}>
        <div
          className="bg-dashboard-surface rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 border-b border-dashboard-border/60 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentStep !== "select-method" && currentStep !== "card-verification" && (
                <button
                  onClick={handleBack}
                  disabled={isProcessing}
                  className="p-1.5 -ml-1.5 hover:bg-dashboard-bg rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="h-5 w-5 text-dashboard-muted" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-dashboard-heading">Fund Wallet</h2>
                <p className="text-[11px] sm:text-xs text-dashboard-muted mt-0.5 truncate">
                  {currentStep === "select-method" && "Choose your preferred funding method"}
                  {currentStep === "bank-transfer" && "Transfer to your account"}
                  {currentStep === "card-funding" && "Fund with card"}
                  {currentStep === "card-verification" && (verificationDone ? "Payment complete" : "Verifying payment")}
                  {currentStep === "smipay-tag" && "Fund via Smipay Tag"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-1.5 -mr-1.5 hover:bg-dashboard-bg rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-dashboard-muted" />
            </button>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {/* Step 1: Select Method */}
            {currentStep === "select-method" && (
              <div className="space-y-2.5">
                {/* Bank Transfer — commented out for now */}
                {/* <button
                  onClick={() => handleMethodSelect("bank-transfer")}
                  className="w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border border-dashboard-border/60 hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03] transition-all group text-left touch-manipulation active:scale-[0.99]"
                >
                  <div className="p-2.5 bg-blue-50 rounded-xl shrink-0 group-hover:bg-blue-100/80 transition-colors">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-semibold text-dashboard-heading">
                      Bank Transfer
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-dashboard-muted mt-0.5">
                      Transfer from any bank to your virtual account
                    </p>
                  </div>
                  <span className="text-dashboard-muted/40 group-hover:text-brand-bg-primary text-lg shrink-0 transition-colors">
                    →
                  </span>
                </button> */}

                {/* Card Funding */}
                <button
                  onClick={() => handleMethodSelect("card")}
                  className="w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border border-dashboard-border/60 hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03] transition-all group text-left touch-manipulation active:scale-[0.99]"
                >
                  <div className="p-2.5 bg-emerald-50 rounded-xl shrink-0 group-hover:bg-emerald-100/80 transition-colors">
                    <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-semibold text-dashboard-heading">
                      Bank Transfer
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-dashboard-muted mt-0.5">
                      Transfer from any bank to your Smipay Account
                    </p>
                  </div>
                  <span className="text-dashboard-muted/40 group-hover:text-brand-bg-primary text-lg shrink-0 transition-colors">
                    →
                  </span>
                </button>

                {/* Smipay Tag - Coming Soon */}
                <button
                  disabled
                  className="w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border border-dashboard-border/40 bg-dashboard-bg/30 cursor-not-allowed opacity-60 text-left"
                >
                  <div className="p-2.5 bg-purple-50 rounded-xl shrink-0">
                    <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] sm:text-[15px] font-semibold text-dashboard-heading">
                        Smipay Tag
                      </h3>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-600 rounded-full uppercase tracking-wide">
                        Coming soon
                      </span>
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-dashboard-muted mt-0.5">
                      Receive funds via your unique Smipay Tag
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: Bank Transfer */}
            {currentStep === "bank-transfer" && primaryAccount && (
              <div className="space-y-4">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-3.5 flex gap-2.5">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[12px] sm:text-[13px] text-blue-800 leading-relaxed">
                    <p className="font-semibold mb-1">How it works:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                      <li>Copy your account details below</li>
                      <li>Transfer from any bank app</li>
                      <li>Wallet credited within 1-2 minutes</li>
                    </ol>
                  </div>
                </div>

                {/* Account Details Card */}
                <div
                  className="rounded-2xl p-4 sm:p-5 text-white"
                  style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      {primaryAccount.bank_name}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        primaryAccount.isActive
                          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                          : "bg-red-500/15 text-red-400 ring-1 ring-red-500/20"
                      }`}
                    >
                      {primaryAccount.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="mb-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Account Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl sm:text-2xl font-mono font-bold tracking-wider flex-1">
                        {primaryAccount.account_number}
                      </p>
                      <button
                        onClick={() => copyToClipboard(primaryAccount.account_number, "account_number")}
                        className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] transition-colors shrink-0"
                        title="Copy"
                      >
                        {copiedField === "account_number" ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Name */}
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Account Name</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-semibold flex-1 truncate">
                        {primaryAccount.account_holder_name}
                      </p>
                      <button
                        onClick={() => copyToClipboard(primaryAccount.account_holder_name, "account_name")}
                        className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] transition-colors shrink-0"
                        title="Copy"
                      >
                        {copiedField === "account_name" ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 sm:p-3.5">
                  <p className="font-semibold text-amber-800 text-[12px] mb-1.5">Important:</p>
                  <ul className="text-[11px] sm:text-[12px] text-amber-700 space-y-0.5 leading-relaxed">
                    <li>• This account is unique to you</li>
                    <li>• Minimum deposit: ₦100</li>
                    <li>• Credited within 1-2 minutes</li>
                  </ul>
                </div>

                {/* Done Button */}
                <Button
                  onClick={handleClose}
                  className="w-full h-11 sm:h-12 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-semibold"
                >
                  Done
                </Button>
              </div>
            )}

            {/* Step 3: Card Funding */}
            {currentStep === "card-funding" && (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13px]">
                    {error}
                  </div>
                )}
                <CardFundingAmount
                  onContinue={handleCardFundingContinue}
                  onCancel={handleCardFundingCancel}
                  isLoading={isProcessing}
                />
              </>
            )}

            {/* Step 4: Card Verification */}
            {currentStep === "card-verification" && paymentReference && (
              <PaymentVerification
                reference={paymentReference}
                onSuccess={handleVerificationSuccess}
                onError={handleVerificationError}
                onRetry={handleVerificationRetry}
                onDismiss={handleClose}
              />
            )}

            {/* Smipay Tag Placeholder */}
            {currentStep === "smipay-tag" && (
              <div className="text-center py-10">
                <Tag className="h-12 w-12 text-dashboard-muted/30 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-dashboard-heading mb-1">
                  Smipay Tag
                </h3>
                <p className="text-[13px] text-dashboard-muted">
                  Coming soon...
                </p>
              </div>
            )}

            {/* No Account */}
            {currentStep === "bank-transfer" && !primaryAccount && (
              <div className="text-center py-10">
                <Building2 className="h-12 w-12 text-dashboard-muted/30 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-dashboard-heading mb-1">
                  No Bank Account
                </h3>
                <p className="text-[13px] text-dashboard-muted">
                  Contact support to set up your virtual account.
                </p>
              </div>
            )}
          </div>

          {/* Safe area spacer for mobile */}
          <div className="h-[env(safe-area-inset-bottom)] shrink-0 sm:hidden" />
        </div>
      </div>
    </>
  );
}
