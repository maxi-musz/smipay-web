"use client";

import { useState, useEffect, useMemo } from "react";
import { NetworkSelector } from "./NetworkSelector";
import { PhoneNumberInput } from "./PhoneNumberInput";
import { AmountInput } from "./AmountInput";
import { FormError } from "@/components/auth/FormError";
import { Loader2, Zap, ShieldCheck } from "lucide-react";
import { useVtpassServiceIds } from "@/hooks/vtpass/vtu/useVtpassServiceIds";
import { vtpassAirtimeApi } from "@/services/vtpass/vtu/vtpass-airtime-api";
import { PurchaseConfirmationModal } from "./PurchaseConfirmationModal";
import { getLastUsed, saveRecentEntry } from "@/lib/recent-numbers";
import { RecentNumbers } from "@/components/dashboard/RecentNumbers";
import type { VtpassPurchaseResponse } from "@/services/vtpass/vtu/vtpass-airtime-api";
import { doesPhoneMatchNigeriaService } from "@/lib/nigeria-network";
import { isAirtimePhoneValidationRelaxed } from "@/lib/dev-phone-validation";

const IS_NETWORK_CHECK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PHONE_NETWORK_CHECK === "true";

const RELAX_PHONE_VALIDATION = isAirtimePhoneValidationRelaxed();

function parseCashbackToNumber(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[₦,\s]/g, "")) || 0;
}

interface AirtimeFormProps {
  onSuccess: (data: VtpassPurchaseResponse) => void;
  onError: (error: string) => void;
  walletBalance: number;
  cashbackBalance?: string;
  cashbackPercent?: number;
}

export function AirtimeForm({ onSuccess, onError, walletBalance, cashbackBalance, cashbackPercent }: AirtimeFormProps) {
  const { serviceIds: allServices, isLoading: loadingServices, error: servicesError } = useVtpassServiceIds();

  const services = useMemo(
    () => allServices.filter(
      (service) => service.serviceID !== "foreign-airtime" && service.serviceID !== "international"
    ),
    [allServices],
  );

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<{
    serviceId?: string;
    phoneNumber?: string;
    amount?: string;
  }>({});
  const [phoneNetworkWarning, setPhoneNetworkWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      const last = getLastUsed("airtime");
      if (last && services.some((s) => s.serviceID === last.serviceID)) {
        setSelectedServiceId(last.serviceID);
      } else {
        setSelectedServiceId(services[0].serviceID);
      }
    }
  }, [services, selectedServiceId]);

  const handleSelectRecent = (entry: { serviceID: string; number: string }) => {
    if (services.some((s) => s.serviceID === entry.serviceID)) {
      setSelectedServiceId(entry.serviceID);
    }
    setPhoneNumber(entry.number);
  };

  useEffect(() => {
    if (selectedServiceId && services.length > 0) {
      const service = services.find((s) => s.serviceID === selectedServiceId);
      if (service) {
        const minAmount = parseFloat(service.minimium_amount);
        const maxAmount = parseFloat(service.maximum_amount);
        const currentAmount = parseFloat(amount) || 0;

        if (currentAmount > 0 && (currentAmount < minAmount || currentAmount > maxAmount)) {
          setAmount("");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId, services]);

  const maxPayable = useMemo(
    () => walletBalance + parseCashbackToNumber(cashbackBalance),
    [walletBalance, cashbackBalance],
  );

  const derivedAmountError = useMemo(() => {
    if (!amount.trim()) return undefined;
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return "Please enter a valid amount";
    const service = services.find((s) => s.serviceID === selectedServiceId);
    if (services.length > 0 && selectedServiceId && !service) return undefined;
    if (service) {
      const minAmt = parseFloat(service.minimium_amount);
      const maxAmt = parseFloat(service.maximum_amount);
      if (n < minAmt) return `Minimum ₦${minAmt.toLocaleString()}`;
      if (n > maxAmt) return `Maximum ₦${maxAmt.toLocaleString()}`;
    }
    if (n > maxPayable + 1e-9) {
      return maxPayable <= 0
        ? "Insufficient balance (wallet + cashback)"
        : `Maximum ₦${maxPayable.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (wallet + cashback)`;
    }
    return undefined;
  }, [amount, services, selectedServiceId, maxPayable]);

useEffect(() => {
  if (servicesError) {
    setServerError(servicesError);
    onError(servicesError);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [servicesError]);

const getPhoneError = (value: string): string | undefined => {
  if (!value) {
    return "Phone number is required";
  }

  if (RELAX_PHONE_VALIDATION) {
    if (value.length < 10 || value.length > 11) {
      return "Enter 10–11 digits (relaxed validation for testing)";
    }
    return undefined;
  }

  if (value.length !== 11) {
    return "Phone number must be 11 digits";
  }

  if (!value.startsWith("0")) {
    return "Phone number must start with 0";
  }

  return undefined;
};

const getPhoneNetworkWarning = (value: string): string | undefined => {
  if (RELAX_PHONE_VALIDATION) {
    return undefined;
  }

  if (!IS_NETWORK_CHECK_ENABLED || !selectedServiceId || services.length === 0) {
    return undefined;
  }

  // Only run network check when number is structurally valid
  if (value.length !== 11 || !value.startsWith("0")) {
    return undefined;
  }

  const service = services.find((s) => s.serviceID === selectedServiceId);
  if (service && !doesPhoneMatchNigeriaService(value, service.name || service.serviceID)) {
    return "This number may not belong to the selected network. You can still continue.";
  }

  return undefined;
};

const validateForm = (): boolean => {
  const newErrors: typeof errors = {};

  if (!selectedServiceId) {
    newErrors.serviceId = "Please select a network provider";
  }

  const phoneError = getPhoneError(phoneNumber);
  if (phoneError) {
    newErrors.phoneNumber = phoneError;
  }

  if (!amount.trim()) {
    newErrors.amount = "Amount is required";
  } else if (derivedAmountError) {
    newErrors.amount = derivedAmountError;
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  useEffect(() => {
    if (!phoneNumber) {
      setPhoneNetworkWarning(null);
      return;
    }

    const phoneError = getPhoneError(phoneNumber);
    const warning = !phoneError ? getPhoneNetworkWarning(phoneNumber) : undefined;

    setErrors((prev) => ({ ...prev, phoneNumber: phoneError }));
    setPhoneNetworkWarning(warning || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId, services, phoneNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      return;
    }

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

      const response = await vtpassAirtimeApi.purchaseAirtime({
        serviceID: selectedServiceId!,
        amount: parseFloat(amount),
        phone: phoneNumber,
        request_id: requestId,
        use_cashback: useCashback || undefined,
      });

      if (response.success) {
        saveRecentEntry("airtime", selectedServiceId!, phoneNumber);
        onSuccess(response.data);
        setAmount("");
        setErrors({});
      } else {
        const errorMsg = response.message || "Transaction failed. Please try again.";
        setServerError(errorMsg);
        onError(errorMsg);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred. Please try again.";
      setServerError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.serviceID === selectedServiceId);
  const minAmount = selectedService ? parseFloat(selectedService.minimium_amount) : 50;
  const maxAmount = selectedService ? parseFloat(selectedService.maximum_amount) : 100000;
  /** Upper bound for amount field: provider max and funds available (wallet + cashback). */
  const effectiveAmountMax = Math.min(maxAmount, Math.max(0, maxPayable));

  const hasPhoneError = Boolean(errors.phoneNumber);
  const amountErrorShown = derivedAmountError ?? errors.amount;

  const isFormReady =
    selectedServiceId &&
    phoneNumber &&
    amount.trim() &&
    !isSubmitting &&
    !loadingServices &&
    !hasPhoneError &&
    !derivedAmountError;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && <FormError message={serverError} />}

      <RecentNumbers type="airtime" onSelect={handleSelectRecent} />

      {/* Row 1: Network dropdown + Phone number */}
      <div>
        <label className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-1 block">
          Phone number
        </label>
        <div className="flex items-center gap-3">
          <NetworkSelector
            services={services}
            selectedServiceId={selectedServiceId}
            onSelect={setSelectedServiceId}
            isLoading={loadingServices}
          />
          <PhoneNumberInput
            inline
            value={phoneNumber}
            onChange={(value) => {
              setPhoneNumber(value);
              const phoneError = getPhoneError(value);
              const warning = !phoneError ? getPhoneNetworkWarning(value) : undefined;
              setErrors((prev) => ({ ...prev, phoneNumber: phoneError }));
              setPhoneNetworkWarning(warning || null);
            }}
            error={errors.phoneNumber}
            disabled={isSubmitting || loadingServices}
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-[12px] text-red-500 font-medium mt-1.5">{errors.phoneNumber}</p>
        )}
        {!errors.phoneNumber && phoneNetworkWarning && (
          <p className="text-[11px] text-amber-600 font-medium mt-1.5">
            {phoneNetworkWarning}
          </p>
        )}
        {errors.serviceId && (
          <p className="text-[12px] text-red-500 font-medium mt-1.5">{errors.serviceId}</p>
        )}
      </div>

      {/* Row 2: Amount */}
      <AmountInput
        value={amount}
        onChange={setAmount}
        error={amountErrorShown}
        disabled={isSubmitting || loadingServices}
        min={minAmount}
        max={effectiveAmountMax}
        presetAmounts={[100, 200, 500, 1000, 2000, 5000]}
        cashbackPercent={cashbackPercent}
      />

      {/* Pay button */}
      <button
        type="submit"
        disabled={!isFormReady}
        className="w-full flex items-center justify-center gap-2 h-12 sm:h-[52px] rounded-xl bg-brand-bg-primary text-white font-semibold text-[15px] sm:text-base transition-all active:scale-[0.99] touch-manipulation shadow-lg shadow-brand-bg-primary/20 hover:shadow-xl hover:shadow-brand-bg-primary/25 hover:bg-brand-bg-primary/90 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Zap className="h-4 w-4" strokeWidth={2.5} />
            Purchase Airtime
          </>
        )}
      </button>

      {/* Info footer */}
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
        <p className="text-[12px] text-dashboard-muted">
          Instant delivery &middot; Double-check number before paying
        </p>
      </div>

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmPurchase}
        network={selectedService || null}
        phoneNumber={phoneNumber}
        amount={parseFloat(amount) || 0}
        walletBalance={walletBalance}
        cashbackBalance={cashbackBalance}
        cashbackPercent={cashbackPercent}
        isLoading={isSubmitting}
      />
    </form>
  );
}
