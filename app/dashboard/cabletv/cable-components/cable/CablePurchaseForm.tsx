"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SmartcardInput } from "./SmartcardInput";
import { FormError } from "@/components/auth/FormError";
import { Loader2, AlertCircle, X } from "lucide-react";
import { vtpassCableApi } from "@/services/vtpass/vtu/vtpass-cable-api";
import { saveRecentEntry } from "@/lib/recent-numbers";
import { RecentNumbers } from "@/components/dashboard/RecentNumbers";
import type {
  VtpassCableVariation,
  VtpassCablePurchaseResponse,
  VtpassCablePurchaseRequest,
  VtpassCableVerifyContent,
} from "@/types/vtpass/vtu/vtpass-cable";
import { PurchaseConfirmationModal } from "./PurchaseConfirmationModal";

function parseCurrencyString(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[₦,]/g, "")) || 0;
}

interface CablePurchaseFormProps {
  selectedServiceId: string;
  selectedVariation: VtpassCableVariation | null;
  serviceName: string;
  verificationData?: VtpassCableVerifyContent | null;
  verifiedSmartcardNumber?: string;
  onSuccess: (data: VtpassCablePurchaseResponse) => void;
  onError: (error: string) => void;
  walletBalance: number;
  cashbackBalance?: string;
  cashbackPercent?: number;
}

export function CablePurchaseForm({
  selectedServiceId,
  selectedVariation,
  serviceName,
  verificationData,
  verifiedSmartcardNumber = "",
  onSuccess,
  onError,
  walletBalance,
  cashbackBalance,
  cashbackPercent,
}: CablePurchaseFormProps) {
  const serviceIdLower = selectedServiceId.toLowerCase();
  const isDSTVOrGOTV = serviceIdLower === "dstv" || serviceIdLower === "gotv";
  const isStartimes = serviceIdLower === "startimes";
  const isShowmax = serviceIdLower === "showmax";
  const isEwallet = isStartimes && selectedVariation?.variation_code === "ewallet";

  const [smartcardNumber, setSmartcardNumber] = useState(verifiedSmartcardNumber || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<"change" | "renew" | null>(
    verificationData ? "renew" : isDSTVOrGOTV ? "change" : null
  );

  const handleSelectRecent = (entry: { serviceID: string; number: string }) => {
    if (isShowmax) {
      setPhoneNumber(entry.number);
    } else {
      setSmartcardNumber(entry.number);
    }
  };

  const [errors, setErrors] = useState<{
    smartcard?: string;
    phoneNumber?: string;
    subscriptionType?: string;
    amount?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const getAmount = (): number => {
    if (isEwallet && customAmount) return parseFloat(customAmount);
    if (isDSTVOrGOTV && subscriptionType === "renew" && verificationData?.Renewal_Amount) {
      return parseFloat(String(verificationData.Renewal_Amount).replace(/[,\s]/g, ""));
    }
    if (selectedVariation) return parseFloat(selectedVariation.variation_amount);
    return 0;
  };

  const amount = getAmount();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!isShowmax) {
      if (!smartcardNumber) {
        newErrors.smartcard = "Smartcard number is required";
      } else {
        const cleaned = smartcardNumber.replace(/[\s-]/g, "");
        if (cleaned.length < 10 || cleaned.length > 11) {
          newErrors.smartcard = "Smartcard number must be 10-11 digits";
        }
      }
    }

    if (isShowmax) {
      if (!phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (phoneNumber.length !== 11) {
        newErrors.phoneNumber = "Phone number must be 11 digits";
      } else if (!phoneNumber.startsWith("0")) {
        newErrors.phoneNumber = "Phone number must start with 0";
      }
    }

    if (isDSTVOrGOTV && !subscriptionType) {
      newErrors.subscriptionType = "Please select subscription type";
    }

    if (isEwallet) {
      if (!customAmount || parseFloat(customAmount) <= 0) {
        newErrors.amount = "Please enter a valid amount";
      }
    }

    const cbNum = parseCurrencyString(cashbackBalance);
    const maxCbDeduction = cbNum > 0 ? Math.min(cbNum, amount) : 0;
    const minFromWallet = amount - maxCbDeduction;
    if (amount > 0 && minFromWallet > walletBalance) {
      setServerError("Insufficient wallet balance. Please top up.");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = async (useCashback: boolean) => {
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
      const randomStr = Math.random().toString(36).substring(2, 8);
      const requestId = `${dateStr}${randomStr}`;

      const billersCode = isShowmax ? phoneNumber : smartcardNumber;
      const purchaseRequest: VtpassCablePurchaseRequest = {
        request_id: requestId,
        serviceID: selectedServiceId,
        billersCode,
        ...(phoneNumber ? { phone: phoneNumber } : {}),
        ...(useCashback ? { use_cashback: true } : {}),
      };

      if (isDSTVOrGOTV) {
        if (subscriptionType) purchaseRequest.subscription_type = subscriptionType;
        purchaseRequest.quantity = 1;
        if (subscriptionType === "change" && selectedVariation) {
          purchaseRequest.variation_code = selectedVariation.variation_code;
        } else if (subscriptionType === "renew") {
          purchaseRequest.amount = amount;
        }
      }

      if (isStartimes || isShowmax) {
        if (selectedVariation) purchaseRequest.variation_code = selectedVariation.variation_code;
        if (isEwallet) {
          purchaseRequest.amount = amount;
        } else if (amount > 0) {
          purchaseRequest.amount = amount;
        }
      }

      const response = await vtpassCableApi.purchaseCable(purchaseRequest);

      if (response.success) {
        const cacheNumber = isShowmax ? phoneNumber : smartcardNumber;
        saveRecentEntry("cable", selectedServiceId, cacheNumber);
        onSuccess(response.data);
        setCustomAmount("");
        setErrors({});
      } else {
        const errorMsg = response.message || "Transaction failed. Please try again.";
        setServerError(errorMsg);
        onError(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again.";
      setServerError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPurchaseLabel = (): string => {
    if (isDSTVOrGOTV && subscriptionType === "renew") return `Renew ${serviceName.replace(" Subscription", "")}`;
    if (isDSTVOrGOTV && subscriptionType === "change") return `Change Bouquet`;
    return `Purchase ${serviceName.replace(" Subscription", "")}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {!verifiedSmartcardNumber && (
        <RecentNumbers type="cable" onSelect={handleSelectRecent} />
      )}

      {/* Smartcard / Phone input */}
      {!isShowmax && (
        <SmartcardInput
          value={smartcardNumber}
          onChange={setSmartcardNumber}
          error={errors.smartcard}
          disabled={isSubmitting || !!verificationData}
          label="Smartcard Number"
          placeholder={isStartimes ? "02123456789" : "7012345678"}
          maxLength={isStartimes ? 11 : 10}
        />
      )}

      {isShowmax && (
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              placeholder="08012345678"
              value={phoneNumber}
              onChange={(e) => {
                const input = e.target.value.replace(/\D/g, "");
                setPhoneNumber(input.slice(0, 11));
              }}
              disabled={isSubmitting}
              className={`w-full bg-transparent text-sm sm:text-base py-2 border-0 border-b-2 focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading ${
                phoneNumber && !isSubmitting ? "pr-8" : ""
              } ${
                errors.phoneNumber ? "border-red-500" : phoneNumber.length === 11 ? "border-green-500" : "border-dashboard-border focus:border-brand-bg-primary"
              }`}
              maxLength={11}
            />
            {phoneNumber && !isSubmitting && (
              <button
                type="button"
                onClick={() => setPhoneNumber("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dashboard-border/40 text-dashboard-muted hover:text-dashboard-heading transition-colors touch-manipulation"
                aria-label="Clear number"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {errors.phoneNumber && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.phoneNumber}</span>
            </div>
          )}
        </div>
      )}

      {/* Phone number for non-Showmax (optional) */}
      {!isShowmax && (
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
            Phone Number <span className="text-dashboard-muted text-[10px]">(optional)</span>
          </label>
          <input
            type="tel"
            placeholder="08012345678"
            value={phoneNumber}
            onChange={(e) => {
              const input = e.target.value.replace(/\D/g, "");
              setPhoneNumber(input.slice(0, 11));
            }}
            disabled={isSubmitting}
            className="w-full bg-transparent text-sm sm:text-base py-2 border-0 border-b-2 border-dashboard-border focus:border-brand-bg-primary focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading"
            maxLength={11}
          />
        </div>
      )}

      {/* Subscription type for DSTV/GOTV */}
      {isDSTVOrGOTV && verificationData && (
        <div className="space-y-3">
          <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
            Subscription Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setSubscriptionType("renew"); setErrors((p) => ({ ...p, subscriptionType: undefined })); }}
              className={`px-4 py-3 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                subscriptionType === "renew"
                  ? "border-brand-bg-primary bg-brand-bg-primary/10 text-brand-bg-primary"
                  : "border-dashboard-border bg-dashboard-surface text-dashboard-heading hover:bg-dashboard-bg"
              }`}
            >
              Renew Current
            </button>
            <button
              type="button"
              onClick={() => { setSubscriptionType("change"); setErrors((p) => ({ ...p, subscriptionType: undefined })); }}
              className={`px-4 py-3 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                subscriptionType === "change"
                  ? "border-brand-bg-primary bg-brand-bg-primary/10 text-brand-bg-primary"
                  : "border-dashboard-border bg-dashboard-surface text-dashboard-heading hover:bg-dashboard-bg"
              }`}
            >
              Change Bouquet
            </button>
          </div>
          {errors.subscriptionType && (
            <p className="text-xs text-red-600">{errors.subscriptionType}</p>
          )}
        </div>
      )}

      {/* Custom amount for Startimes eWallet */}
      {isEwallet && (
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-dashboard-muted">₦</span>
            <input
              type="tel"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => {
                const input = e.target.value.replace(/[^\d.]/g, "");
                setCustomAmount(input);
              }}
              disabled={isSubmitting}
              className="w-full bg-transparent text-sm sm:text-base py-2 pl-4 border-0 border-b-2 border-dashboard-border focus:border-brand-bg-primary focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading"
            />
          </div>
          {errors.amount && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.amount}</span>
            </div>
          )}
        </div>
      )}

      {/* Plan recap */}
      {selectedVariation && !isEwallet && (
        <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Plan</p>
              <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">{selectedVariation.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Amount</p>
              <p className="text-base sm:text-lg font-bold text-dashboard-heading tabular-nums">
                ₦{amount.toLocaleString()}
              </p>
            </div>
          </div>
          {isDSTVOrGOTV && subscriptionType === "renew" && verificationData?.Current_Bouquet && (
            <div className="mt-3 pt-3 border-t border-dashboard-border/60">
              <p className="text-[10px] sm:text-xs text-dashboard-muted">
                Renewing <strong className="text-dashboard-heading">{verificationData.Current_Bouquet}</strong> at renewal price
              </p>
            </div>
          )}
        </div>
      )}

      {serverError && <FormError message={serverError} />}

      <Button
        type="submit"
        disabled={
          isSubmitting ||
          (isDSTVOrGOTV && !subscriptionType) ||
          (!isShowmax && (!smartcardNumber || smartcardNumber.length < 10)) ||
          (isShowmax && (!phoneNumber || phoneNumber.length !== 11)) ||
          (isEwallet && (!customAmount || parseFloat(customAmount) <= 0)) ||
          ((isDSTVOrGOTV && subscriptionType === "change") || isStartimes || isShowmax ? !selectedVariation : false)
        }
        className="w-full min-h-12 h-12 sm:min-h-[52px] sm:h-[52px] rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-base sm:text-lg font-semibold shadow-sm transition-all active:scale-[0.99] touch-manipulation"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing…
          </>
        ) : (
          getPurchaseLabel()
        )}
      </Button>

      <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/80 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-dashboard-muted">
          <strong className="text-dashboard-heading">Note:</strong>{" "}
          {isShowmax
            ? "Your Showmax voucher code will be displayed after successful purchase. Save it to activate your subscription."
            : `Your ${serviceName.replace(" Subscription", "")} subscription will be activated on the smartcard number provided.`}
        </p>
      </div>

      <PurchaseConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmPurchase}
        serviceName={serviceName}
        serviceID={selectedServiceId}
        planName={
          isDSTVOrGOTV && subscriptionType === "renew"
            ? verificationData?.Current_Bouquet || selectedVariation?.name || "Current Plan"
            : selectedVariation?.name || "Selected Plan"
        }
        smartcardNumber={isShowmax ? phoneNumber : smartcardNumber}
        amount={amount}
        subscriptionType={subscriptionType || undefined}
        isLoading={isSubmitting}
        isShowmax={isShowmax}
        walletBalance={walletBalance}
        cashbackBalance={cashbackBalance}
        cashbackPercent={cashbackPercent}
      />
    </form>
  );
}
