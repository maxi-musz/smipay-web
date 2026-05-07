"use client";

import { useState, useEffect, useCallback } from "react";
import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { WalletCard } from "@/components/dashboard/WalletCard";
import Image from "next/image";
import {
  Zap,
  ArrowLeft,
  ChevronRight,
  Star,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  User,
  Gauge,
  Ban,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { getNetworkLogo } from "@/lib/network-logos";
import { TransactionStatusModal } from "../electricity-components/electricity/TransactionStatusModal";
import { PurchaseConfirmationModal } from "../electricity-components/electricity/PurchaseConfirmationModal";
import { useVtpassElectricityServiceIds } from "@/hooks/vtpass/vtu/useVtpassElectricityServiceIds";
import { useVtpassElectricityStore } from "@/store/vtpass/vtu/vtpass-electricity-store";
import { useDashboard } from "@/hooks/useDashboard";
import { FormError } from "@/components/auth/FormError";
import { getLastUsed, saveRecentEntry } from "@/lib/recent-numbers";
import { vtpassElectricityApi } from "@/services/vtpass/vtu/vtpass-electricity-api";
import { RecentNumbers } from "@/components/dashboard/RecentNumbers";
import type {
  VtpassElectricityVerifyContent,
  VtpassElectricityPurchaseResponse,
  MeterType,
} from "@/types/vtpass/vtu/vtpass-electricity";
import { motion, AnimatePresence } from "motion/react";

const FAVORITES_KEY = "electricity-provider-favorites";
const PRESET_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000];

const PROVIDER_FALLBACK_MIN: Record<string, number> = {
  "ibadan-electric": 2000,
  "ikeja-electric": 1000,
  "eko-electric": 1000,
  "kano-electric": 1000,
  "portharcourt-electric": 1000,
  "kaduna-electric": 1000,
  "abuja-electric": 1000,
  "enugu-electric": 1000,
  "benin-electric": 1000,
  "jos-electric": 500,
  "aba-electric": 500,
  "yola-electric": 500,
};

function getDisplayName(name: string): string {
  if (name.includes("IKEDC")) return "Ikeja Electricity";
  if (name.includes("EKEDC")) return "Eko Electricity";
  if (name.includes("KEDCO") || name.includes("Kano")) return "Kano Electricity";
  if (name.includes("PHED") || name.includes("Port Harcourt")) return "Port Harcourt Electricity";
  if (name.includes("JED") || name.includes("Jos")) return "Jos Electricity";
  if (name.includes("IBEDC") || name.includes("Ibadan")) return "Ibadan Electricity";
  if (name.includes("KAEDCO") || name.includes("Kaduna")) return "Kaduna Electricity";
  if (name.includes("AEDC") || name.includes("Abuja")) return "Abuja Electricity";
  if (name.includes("EEDC") || name.includes("Enugu")) return "Enugu Electricity";
  if (name.includes("BEDC") || name.includes("Benin")) return "Benin Electricity";
  if (name.includes("ABA") || name.includes("Aba")) return "Aba Electricity";
  if (name.includes("YEDC") || name.includes("Yola")) return "Yola Electricity";
  return name;
}

export default function VtpassElectricityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProvider = searchParams.get("provider")?.toLowerCase() || null;
  const { dashboardData, refetch } = useDashboard();
  const {
    serviceIds: allServices,
    isLoading: loadingServices,
    error: servicesError,
    refetch: refetchServices,
  } = useVtpassElectricityServiceIds();

  // Provider state — initialize synchronously from cached store to avoid flash
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(() => {
    const cached = useVtpassElectricityStore.getState().serviceIds;
    if (!cached || cached.length === 0) return null;
    if (initialProvider) {
      const found = cached.find((s) => s.serviceID.toLowerCase() === initialProvider);
      if (found) return found.serviceID;
    }
    const last = getLastUsed("electricity");
    if (last && cached.some((s) => s.serviceID === last.serviceID)) return last.serviceID;
    return cached[0].serviceID;
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Form state
  const [meterType, setMeterType] = useState<MeterType>("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState<VtpassElectricityVerifyContent | null>(null);
  const [verifyError, setVerifyError] = useState("");

  // Purchase state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [serverError, setServerError] = useState("");
  const [formErrors, setFormErrors] = useState<{ amount?: string; phone?: string }>({});

  // Transaction state
  const [transactionStatus, setTransactionStatus] = useState<"success" | "processing" | "error" | null>(null);
  const [transactionData, setTransactionData] = useState<VtpassElectricityPurchaseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);

  const walletBalance = dashboardData
    ? parseFloat(dashboardData.wallet_card.current_balance.replace(/,/g, ""))
    : 0;
  const cashbackBalance = dashboardData?.cashback_wallet?.current_balance;
  const electricityCbRate = dashboardData?.cashback_rates?.find(
    (r) => r.service === "electricity" && r.is_active
  );
  const cashbackPercent = electricityCbRate?.percentage;

  const selectedService = allServices.find((s) => s.serviceID === selectedServiceId);
  const selectedLogo = selectedServiceId
    ? getNetworkLogo(selectedServiceId) || selectedService?.image
    : null;

  const apiMin = verificationData?.Min_Purchase_Amount
    ? parseFloat(String(verificationData.Min_Purchase_Amount).replace(/[,\s]/g, "")) || 0
    : 0;
  const fallbackMin = selectedServiceId ? (PROVIDER_FALLBACK_MIN[selectedServiceId] ?? 500) : 500;
  const providerMin = apiMin > 0 ? apiMin : fallbackMin;
  const minAmount = Math.max(500, providerMin);

  const canVend = verificationData?.Can_Vend
    ? verificationData.Can_Vend.toLowerCase() === "yes"
    : true;

  // Load favorites
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try { setFavorites(new Set(JSON.parse(saved))); } catch { setFavorites(new Set()); }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || favorites.size === 0) return;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Fallback auto-select — only runs if store was empty on mount (first visit)
  useEffect(() => {
    if (allServices.length > 0 && !selectedServiceId) {
      if (initialProvider) {
        const found = allServices.find((s) => s.serviceID.toLowerCase() === initialProvider);
        if (found) { setSelectedServiceId(found.serviceID); return; }
      }
      const last = getLastUsed("electricity");
      if (last && allServices.some((s) => s.serviceID === last.serviceID)) {
        setSelectedServiceId(last.serviceID);
      } else {
        setSelectedServiceId(allServices[0].serviceID);
      }
    }
  }, [allServices, selectedServiceId, initialProvider]);

  // Reset form when provider changes
  useEffect(() => {
    setVerificationData(null);
    setVerifyError("");
    setMeterNumber("");
    setAmount("");
    setPhoneNumber("");
    setServerError("");
    setFormErrors({});
  }, [selectedServiceId]);

  // Reset verification when meter type changes
  useEffect(() => {
    setVerificationData(null);
    setVerifyError("");
  }, [meterType]);

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (sheetOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  const toggleFavorite = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId); else next.add(serviceId);
      return next;
    });
  };

  // Sort services: favorites first
  const sortedServices = [...allServices].sort((a, b) => {
    const aFav = favorites.has(a.serviceID);
    const bFav = favorites.has(b.serviceID);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  // --- Verify meter ---
  const handleVerify = useCallback(async () => {
    if (!selectedServiceId || !meterNumber || meterNumber.length < 10) return;
    setIsVerifying(true);
    setVerifyError("");
    try {
      const response = await vtpassElectricityApi.verifyMeter({
        billersCode: meterNumber,
        serviceID: selectedServiceId,
        type: meterType,
      });

      if (response.data?.content?.WrongBillersCode) {
        setVerifyError("Invalid meter number. Please check and try again.");
        return;
      }

      if ((response.success || response.data?.code === "000") && response.data?.content) {
        setVerificationData(response.data.content);
        return;
      }

      setVerifyError(response.message || "Verification failed. Please try again.");
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setIsVerifying(false);
    }
  }, [selectedServiceId, meterNumber, meterType]);

  // --- Validate purchase form ---
  const validatePurchase = (): boolean => {
    const errs: typeof formErrors = {};
    const numericAmount = parseFloat(amount);

    if (!amount) errs.amount = "Amount is required";
    else if (isNaN(numericAmount) || numericAmount <= 0) errs.amount = "Enter a valid amount";
    else if (numericAmount < minAmount) errs.amount = `Minimum is ₦${minAmount.toLocaleString()}`;
    else if (numericAmount > 500000) errs.amount = "Maximum is ₦500,000";
    else if (numericAmount > walletBalance) errs.amount = "Insufficient balance";

    if (!phoneNumber) errs.phone = "Phone number is required";
    else if (phoneNumber.length !== 11) errs.phone = "Must be 11 digits";
    else if (!phoneNumber.startsWith("0")) errs.phone = "Must start with 0";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validatePurchase()) return;
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = async (useCashback: boolean) => {
    if (!selectedServiceId || !verificationData) return;
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
      const randomStr = Math.random().toString(36).substring(2, 10);
      const requestId = `${dateStr}${randomStr}`;

      const response = await vtpassElectricityApi.purchaseElectricity({
        serviceID: selectedServiceId,
        billersCode: meterNumber,
        variation_code: meterType,
        amount: parseFloat(amount),
        phone: phoneNumber,
        request_id: requestId,
        ...(useCashback ? { use_cashback: true } : {}),
        ...(verificationData?.Customer_Name ? { customer_name: verificationData.Customer_Name } : {}),
        ...(verificationData?.Address ? { customer_address: verificationData.Address } : {}),
      });

      if (response.success) {
        saveRecentEntry("electricity", selectedServiceId, meterNumber);
        setLastRequestId(response.data.requestId || requestId);
        handleTransactionResult(response.data);
      } else {
        const msg = response.message || "Transaction failed. Please try again.";
        setServerError(msg);
        setErrorMessage(msg);
        setTransactionStatus("error");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "An error occurred.";
      setServerError(msg);
      setErrorMessage(msg);
      setTransactionStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransactionResult = async (data: VtpassElectricityPurchaseResponse) => {
    const txStatus = data.content?.transactions?.status;
    const code = data.code;

    if (data.status === "processing" || txStatus === "pending" || txStatus === "initiated" || code === "099") {
      setTransactionData(data);
      setTransactionStatus("processing");
      refetch();
      return;
    }
    if (code === "016" || code === "040" || txStatus === "failed" || txStatus === "reversed") {
      setTransactionData(data);
      setTransactionStatus("error");
      setErrorMessage(data.response_description || "Transaction failed. Your wallet has been refunded.");
      refetch();
      return;
    }
    if (data.id) {
      await refetch();
      router.replace(`/dashboard/transactions/${data.id}`);
      return;
    }
    if (data.electricity_token && meterType === "prepaid") {
      refetch();
      setTransactionData(data);
      setTransactionStatus("success");
      return;
    }
    refetch();
    setTransactionData(data);
    setTransactionStatus(txStatus === "delivered" ? "success" : "processing");
  };

  const handleSelectRecent = (entry: { serviceID: string; number: string }) => {
    setPhoneNumber(entry.number);
  };

  const primaryAccount = dashboardData?.accounts?.[0];

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Fixed: header + wallet card — never scrolls, always visible */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-dashboard-bg pb-4 sm:pb-5">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-dashboard-surface border-b border-dashboard-border/60"
        >
          <div className="flex items-center gap-2.5 sm:gap-4 px-3.5 py-2.5 sm:px-6 sm:py-3.5 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="h-8 w-8 shrink-0 rounded-lg text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-border/50 sm:h-9 sm:w-9"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-sm sm:text-base font-semibold text-dashboard-heading tracking-tight">
              Electricity
            </h1>
          </div>
        </motion.header>

        {/* Wallet card — always visible in fixed area */}
        {dashboardData && (
          <div className="px-3.5 pt-4 sm:px-6 sm:pt-5 lg:px-8">
            <section className="max-w-xl w-full min-w-0">
              <WalletCard
                bankName={primaryAccount?.bank_name}
                accountNumber={primaryAccount?.account_number}
                accountHolderName={primaryAccount?.account_holder_name}
                balance={walletBalance}
                isActive={primaryAccount?.isActive ?? true}
                compact
              />
            </section>
          </div>
        )}
      </div>

      {/* Spacer: reserves space so content doesn't hide under fixed block */}
      <div className="h-[200px] sm:h-[220px]" aria-hidden />

      {/* Scrollable content */}
      <div className="px-3.5 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-5 lg:px-8 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3.5 sm:space-y-5 overflow-x-hidden">
        <section className="hidden sm:block max-w-4xl w-full min-w-0">
          <WalletAnalysisCards />
        </section>

        {servicesError && (
          <div className="max-w-xl">
            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="flex-1">
                {servicesError}
              </p>
              <button
                type="button"
                onClick={() => refetchServices()}
                className="p-1.5 rounded-full hover:bg-red-100 text-red-700 flex-shrink-0 touch-manipulation"
                aria-label="Retry loading providers"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Main form card ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="max-w-xl w-full min-w-0"
        >
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm px-3.5 py-4 sm:p-5 space-y-4"
          >
            {/* ─── Service Provider ─── */}
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-dashboard-muted mb-1.5">
                Service Provider
              </p>
              <button
                type="button"
                onClick={() => !loadingServices && setSheetOpen(true)}
                disabled={loadingServices}
                className="w-full flex items-center gap-2.5 py-2 border-b border-dashboard-border/80 text-left transition-colors hover:bg-dashboard-bg/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingServices ? (
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="h-7 w-7 rounded-full bg-dashboard-border/60 animate-pulse shrink-0" />
                    <div className="h-3.5 w-24 rounded bg-dashboard-border/60 animate-pulse" />
                  </div>
                ) : selectedService ? (
                  <>
                    {selectedLogo ? (
                      <div className="relative h-7 w-7 rounded-full overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
                        <Image src={selectedLogo} alt={selectedService.name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-dashboard-border/50 flex items-center justify-center shrink-0">
                        <Zap className="h-3.5 w-3.5 text-dashboard-muted" />
                      </div>
                    )}
                    <span className="flex-1 text-[13px] font-semibold text-dashboard-heading truncate">
                      {getDisplayName(selectedService.name)}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-[13px] text-dashboard-muted">Select a provider</span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-dashboard-muted shrink-0" />
              </button>
            </div>

            {/* ─── Meter Type Toggle ─── */}
            <div>
              <div className="grid grid-cols-2 rounded-lg border border-dashboard-border/80 overflow-hidden">
                {(["prepaid", "postpaid"] as const).map((type) => {
                  const active = meterType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMeterType(type)}
                      className={`relative flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all touch-manipulation ${
                        active
                          ? "bg-brand-bg-primary/10 text-brand-bg-primary"
                          : "bg-dashboard-surface text-dashboard-muted hover:bg-dashboard-bg/60"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" strokeWidth={3} />}
                      <span className="capitalize">{type}</span>
                      {active && (
                        <motion.div
                          layoutId="meter-type-indicator"
                          className="absolute inset-0 rounded-lg border-2 border-brand-bg-primary pointer-events-none"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Meter / Account Number ─── */}
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-dashboard-muted mb-1.5">
                Meter / Account Number
              </p>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Enter Meter Number"
                  value={meterNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                    setMeterNumber(v);
                    if (verificationData) {
                      setVerificationData(null);
                      setVerifyError("");
                    }
                  }}
                  disabled={isVerifying}
                  className={`w-full bg-transparent text-sm py-2 border-0 border-b-2 focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/40 text-dashboard-heading ${
                    meterNumber && !isVerifying ? "pr-8" : ""
                  } ${
                    verifyError
                      ? "border-red-500 focus:border-red-500"
                      : verificationData
                      ? "border-green-500"
                      : "border-dashboard-border focus:border-brand-bg-primary"
                  }`}
                  maxLength={13}
                />
                {meterNumber && !isVerifying && (
                  <button
                    type="button"
                    onClick={() => {
                      setMeterNumber("");
                      setVerificationData(null);
                      setVerifyError("");
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dashboard-border/40 text-dashboard-muted hover:text-dashboard-heading transition-colors touch-manipulation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Verification result */}
              {verificationData && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2.5 rounded-lg border p-3 space-y-2 ${
                    canVend
                      ? "border-green-200/80 bg-green-50/60"
                      : "border-red-200/80 bg-red-50/60"
                  }`}
                >
                  {/* Customer Name */}
                  <div className="flex items-start gap-2">
                    <User className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${canVend ? "text-green-600" : "text-red-600"}`} />
                    <div className="min-w-0">
                      <p className={`text-[10px] ${canVend ? "text-green-700" : "text-red-700"}`}>Customer</p>
                      <p className={`text-xs sm:text-sm font-semibold ${canVend ? "text-green-900" : "text-red-900"}`}>
                        {verificationData.Customer_Name || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  {verificationData.Address && (
                    <div className="flex items-start gap-2 pt-2 border-t border-green-200/50">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-green-700">Address</p>
                        <p className="text-[11px] sm:text-xs font-medium text-green-900 leading-tight">
                          {verificationData.Address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Meter Type + Account Type */}
                  <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-green-200/50">
                    {verificationData.Meter_Type && (
                      <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded ${
                        verificationData.Meter_Type.toUpperCase() === "PREPAID"
                          ? "bg-green-200 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {verificationData.Meter_Type}
                      </span>
                    )}
                    {verificationData.Customer_Account_Type && (
                      <span className="text-[10px] sm:text-xs font-medium text-green-700">
                        {verificationData.Customer_Account_Type === "NMD" ? "Residential (NMD)" : "Industrial (MD)"}
                      </span>
                    )}
                  </div>

                  {/* Arrears */}
                  {verificationData.Customer_Arrears && verificationData.Customer_Arrears !== "" && (
                    <div className="flex items-center justify-between pt-2 border-t border-green-200/50">
                      <span className="text-[10px] sm:text-xs text-amber-700">Outstanding Arrears</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-700">
                        ₦{parseFloat(String(verificationData.Customer_Arrears).replace(/[,\s]/g, "")).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Min Purchase Amount */}
                  {minAmount > 500 && (
                    <div className="flex items-center justify-between pt-2 border-t border-green-200/50">
                      <span className="text-[10px] sm:text-xs text-green-700">Min. Purchase Amount</span>
                      <span className="text-xs sm:text-sm font-bold text-green-900">
                        ₦{minAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Can_Vend = no warning */}
                  {!canVend && (
                    <div className="flex items-center gap-2 pt-2 border-t border-red-200/50">
                      <Ban className="h-4 w-4 text-red-600 shrink-0" />
                      <p className="text-xs font-semibold text-red-700">
                        This meter cannot be vended at this time. Please try again later or contact your disco.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Verify error */}
              {verifyError && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Validate button */}
              {!verificationData && meterNumber.length >= 10 && !verifyError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5">
                  <Button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="w-full h-9 rounded-lg bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-xs font-semibold transition-all active:scale-[0.99] touch-manipulation"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating…
                      </>
                    ) : (
                      "Validate Meter"
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Retry after error */}
              {verifyError && (
                <div className="mt-2.5">
                  <Button
                    type="button"
                    onClick={() => { setVerifyError(""); handleVerify(); }}
                    disabled={isVerifying}
                    variant="outline"
                    className="w-full h-9 rounded-lg text-xs font-semibold border-dashboard-border"
                  >
                    {isVerifying ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Retrying…</>
                    ) : (
                      "Retry Validation"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* ─── Amount & Payment (after verification, only if Can_Vend) ─── */}
            <AnimatePresence>
              {verificationData && canVend && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3.5 overflow-hidden"
                >
                  {/* Select Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] sm:text-xs font-semibold text-dashboard-heading">
                        Select Amount
                      </p>
                      {minAmount > 500 && (
                        <span className="text-[9px] sm:text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          Min ₦{minAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRESET_AMOUNTS.map((preset) => {
                        const active = amount === String(preset);
                        const belowMin = preset < minAmount;
                        return (
                          <button
                            key={preset}
                            type="button"
                            disabled={belowMin}
                            onClick={() => {
                              setAmount(String(preset));
                              setFormErrors((p) => ({ ...p, amount: undefined }));
                            }}
                            className={`py-2 rounded-lg border text-xs font-bold transition-all touch-manipulation ${
                              belowMin
                                ? "border-dashboard-border/30 bg-dashboard-bg/30 text-dashboard-muted/30 cursor-not-allowed line-through"
                                : active
                                ? "border-brand-bg-primary bg-brand-bg-primary/10 text-brand-bg-primary"
                                : "border-dashboard-border/70 bg-dashboard-surface text-dashboard-heading hover:bg-dashboard-bg/60"
                            }`}
                          >
                            ₦{preset.toLocaleString()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom amount */}
                  <div>
                    <div className="flex items-center gap-2 border-b-2 border-dashboard-border focus-within:border-brand-bg-primary transition-colors">
                      <span className="text-sm font-semibold text-dashboard-muted">₦</span>
                      <input
                        type="tel"
                        placeholder={`Min ₦${minAmount.toLocaleString()}`}
                        value={amount ? `${parseFloat(amount).toLocaleString()}` : ""}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d]/g, "");
                          setAmount(v);
                          setFormErrors((p) => ({ ...p, amount: undefined }));
                        }}
                        disabled={isSubmitting}
                        className="flex-1 bg-transparent text-sm py-2 border-0 focus:outline-none focus:ring-0 placeholder:text-dashboard-muted/40 text-dashboard-heading"
                      />
                    </div>
                    {formErrors.amount && (
                      <div className="flex items-center gap-2 text-[11px] text-red-600 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{formErrors.amount}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-dashboard-muted mb-1.5">
                      Phone Number
                    </p>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="08012345678"
                        value={phoneNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                          setPhoneNumber(v);
                          setFormErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        disabled={isSubmitting}
                        className={`w-full bg-transparent text-sm py-2 border-0 border-b-2 focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/40 text-dashboard-heading ${
                          phoneNumber && !isSubmitting ? "pr-8" : ""
                        } ${
                          formErrors.phone
                            ? "border-red-500 focus:border-red-500"
                            : phoneNumber.length === 11
                            ? "border-green-500 focus:border-green-500"
                            : "border-dashboard-border focus:border-brand-bg-primary"
                        }`}
                        maxLength={11}
                      />
                      {phoneNumber && !isSubmitting && (
                        <button
                          type="button"
                          onClick={() => setPhoneNumber("")}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dashboard-border/40 text-dashboard-muted hover:text-dashboard-heading transition-colors touch-manipulation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {formErrors.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-red-600 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{formErrors.phone}</span>
                      </div>
                    )}
                  </div>

                  <RecentNumbers type="electricity" onSelect={handleSelectRecent} />

                  {serverError && <FormError message={serverError} />}

                  {/* Pay button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !amount || !phoneNumber}
                    className="w-full h-10 rounded-lg bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-[13px] font-semibold shadow-sm transition-all active:scale-[0.99] touch-manipulation"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
                    ) : meterType === "prepaid" ? (
                      `Buy Token${amount ? ` — ₦${parseFloat(amount).toLocaleString()}` : ""}`
                    ) : (
                      `Pay Bill${amount ? ` — ₦${parseFloat(amount).toLocaleString()}` : ""}`
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.section>
      </div>

      {/* ── Provider Bottom Sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setSheetOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-dashboard-surface rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-dashboard-border/60" />
              </div>

              {/* Sheet header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-dashboard-border/60">
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-1.5 -ml-1.5 rounded-lg hover:bg-dashboard-bg transition-colors touch-manipulation"
                >
                  <ArrowLeft className="h-5 w-5 text-dashboard-heading" />
                </button>
                <h3 className="text-base font-semibold text-dashboard-heading">Select Provider</h3>
              </div>

              {/* Provider list */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {sortedServices.map((service) => {
                  const isSelected = selectedServiceId === service.serviceID;
                  const logo = getNetworkLogo(service.serviceID) || service.image;
                  const isFav = favorites.has(service.serviceID);

                  return (
                    <button
                      key={service.serviceID}
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(service.serviceID);
                        setSheetOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-dashboard-bg/60 active:bg-dashboard-bg border-b border-dashboard-border/30 last:border-b-0"
                    >
                      {logo ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
                          <Image src={logo} alt={service.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-dashboard-border/50 flex items-center justify-center shrink-0">
                          <Zap className="h-5 w-5 text-dashboard-muted" />
                        </div>
                      )}
                      <span className={`flex-1 text-sm truncate ${isSelected ? "font-semibold text-brand-bg-primary" : "text-dashboard-heading"}`}>
                        {getDisplayName(service.name)}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => toggleFavorite(service.serviceID, e)}
                          className="p-1.5 rounded-lg hover:bg-dashboard-border/40 transition-colors touch-manipulation"
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              isFav ? "fill-yellow-400 text-yellow-400" : "text-dashboard-muted/25 hover:text-yellow-400"
                            }`}
                          />
                        </button>
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? "border-brand-bg-primary bg-brand-bg-primary" : "border-dashboard-border/60"
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirmation Modal ── */}
      {showConfirmation && selectedServiceId && selectedService && verificationData && (
        <PurchaseConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmPurchase}
          serviceName={selectedService.name}
          serviceID={selectedServiceId}
          meterNumber={meterNumber}
          meterType={meterType}
          customerName={verificationData.Customer_Name}
          amount={parseFloat(amount) || 0}
          walletBalance={walletBalance}
          cashbackBalance={cashbackBalance}
          cashbackPercent={cashbackPercent}
          isLoading={isSubmitting}
        />
      )}

      {/* ── Transaction Status Modal ── */}
      {transactionStatus && (
        <TransactionStatusModal
          isOpen={!!transactionStatus}
          onClose={() => { setTransactionStatus(null); setTransactionData(null); setErrorMessage(""); setLastRequestId(null); refetch(); }}
          status={transactionStatus}
          transactionData={transactionData || undefined}
          errorMessage={errorMessage || undefined}
          onRetry={() => { setTransactionStatus(null); setTransactionData(null); setErrorMessage(""); }}
          serviceID={selectedServiceId || undefined}
          meterType={meterType}
          requestId={lastRequestId || undefined}
          onStatusUpdate={(data: { code: string; response_description: string; content?: { transactions: { status: string } }; electricity_token?: string; units?: string; amount?: number; requestId?: string }) => {
            const txStatus = data.content?.transactions?.status;
            const code = data.code;
            if (code === "016" || code === "040" || txStatus === "failed" || txStatus === "reversed") {
              setTransactionData(data as unknown as VtpassElectricityPurchaseResponse);
              setTransactionStatus("error");
              setErrorMessage(data.response_description || "Transaction failed. Your wallet has been refunded.");
              refetch();
            } else if (code === "000" && txStatus === "delivered") {
              setTransactionData(data as unknown as VtpassElectricityPurchaseResponse);
              setTransactionStatus("success");
              refetch();
            }
          }}
        />
      )}
    </div>
  );
}
