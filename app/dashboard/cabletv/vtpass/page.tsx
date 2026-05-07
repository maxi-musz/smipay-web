"use client";

import { useState, useEffect } from "react";
import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { WalletCard } from "@/components/dashboard/WalletCard";
import Image from "next/image";
import { Tv, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { getNetworkLogo } from "@/lib/network-logos";
import { ProviderSelector } from "../cable-components/cable/ProviderSelector";
import { PlanSelector } from "../cable-components/cable/PlanSelector";
import { SmartcardVerificationForm } from "../cable-components/cable/SmartcardVerificationForm";
import { CablePurchaseForm } from "../cable-components/cable/CablePurchaseForm";
import { TransactionStatusModal } from "../cable-components/cable/TransactionStatusModal";
import { useVtpassCableServiceIds } from "@/hooks/vtpass/vtu/useVtpassCableServiceIds";
import { useVtpassCableVariationCodes } from "@/hooks/vtpass/vtu/useVtpassCableVariationCodes";
import { useDashboard } from "@/hooks/useDashboard";
import { FormError } from "@/components/auth/FormError";
import { getLastUsed } from "@/lib/recent-numbers";
import type {
  VtpassCableVariation,
  VtpassCablePurchaseResponse,
  VtpassCableVerifyContent,
} from "@/types/vtpass/vtu/vtpass-cable";
import { motion } from "motion/react";

type Step = "select" | "verify" | "purchase";

export default function VtpassCabletvPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProvider = searchParams.get("provider")?.toLowerCase() || null;

  const { dashboardData, refetch } = useDashboard();
  const {
    serviceIds: allServices,
    isLoading: loadingServices,
    error: servicesError,
  } = useVtpassCableServiceIds();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<VtpassCableVariation | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [verificationData, setVerificationData] = useState<VtpassCableVerifyContent | null>(null);
  const [verifiedSmartcardNumber, setVerifiedSmartcardNumber] = useState("");
  const [transactionStatus, setTransactionStatus] = useState<"success" | "processing" | "error" | null>(null);
  const [transactionData, setTransactionData] = useState<VtpassCablePurchaseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    variationCodes,
    isLoading: loadingVariations,
    error: variationsError,
  } = useVtpassCableVariationCodes(selectedServiceId);

  const walletBalance = dashboardData
    ? parseFloat(dashboardData.wallet_card.current_balance.replace(/,/g, ""))
    : 0;
  const cashbackBalance = dashboardData?.cashback_wallet?.current_balance;
  const cableCbRate = dashboardData?.cashback_rates?.find(
    (r) => (r.service === "cable" || r.service === "cabletv") && r.is_active
  );
  const cashbackPercent = cableCbRate?.percentage;

  const serviceIdLower = selectedServiceId?.toLowerCase() || "";
  const isDSTVOrGOTV = serviceIdLower === "dstv" || serviceIdLower === "gotv";
  const isStartimes = serviceIdLower === "startimes";
  const isShowmax = serviceIdLower === "showmax";
  const supportsVerification = isDSTVOrGOTV || isStartimes;

  // Auto-select provider from query param, localStorage cache, or first available
  useEffect(() => {
    if (allServices.length > 0 && !selectedServiceId) {
      if (initialProvider) {
        const found = allServices.find(
          (s) => s.serviceID.toLowerCase() === initialProvider
        );
        if (found) {
          queueMicrotask(() => setSelectedServiceId(found.serviceID));
          return;
        }
      }
      const last = getLastUsed("cable");
      if (last && allServices.some((s) => s.serviceID === last.serviceID)) {
        queueMicrotask(() => setSelectedServiceId(last.serviceID));
      } else {
        queueMicrotask(() => setSelectedServiceId(allServices[0].serviceID));
      }
    }
  }, [allServices, selectedServiceId, initialProvider]);

  // Reset when provider changes
  useEffect(() => {
    queueMicrotask(() => {
      setSelectedVariation(null);
      setStep("select");
      setVerificationData(null);
      setVerifiedSmartcardNumber("");
    });
  }, [selectedServiceId]);

  const handleSelectPlan = (variation: VtpassCableVariation) => {
    setSelectedVariation(variation);

    if (isShowmax) {
      // Showmax: skip verify, go straight to purchase
      setStep("purchase");
    } else if (supportsVerification && !verificationData) {
      // DSTV/GOTV/Startimes: verify first (unless already verified)
      setStep("verify");
    } else {
      setStep("purchase");
    }
  };

  const handleVerificationSuccess = (data: VtpassCableVerifyContent, smartcardNumber: string) => {
    setVerificationData(data);
    setVerifiedSmartcardNumber(smartcardNumber);
    setStep("purchase");
  };

  const handleBack = () => {
    if (step === "purchase" && supportsVerification && !verificationData) {
      setStep("verify");
    } else if (step === "purchase" || step === "verify") {
      setStep("select");
    } else {
      router.push("/dashboard");
    }
  };

  const handleTransactionSuccess = async (data: VtpassCablePurchaseResponse) => {
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
    } else {
      refetch();
      setTransactionData(data);
      setTransactionStatus(txStatus === "delivered" ? "success" : "processing");
    }
  };

  const handleTransactionError = (error: string) => {
    setErrorMessage(error);
    setTransactionStatus("error");
  };

  const handleModalClose = () => {
    setTransactionStatus(null);
    setTransactionData(null);
    setErrorMessage("");
    refetch();
  };

  const handleRetry = () => {
    setTransactionStatus(null);
    setTransactionData(null);
    setErrorMessage("");
  };

  const selectedService = allServices.find((s) => s.serviceID === selectedServiceId);

  const getHeaderTitle = (): string => {
    if (step === "purchase") return "Complete Purchase";
    if (step === "verify") return "Verify Smartcard";
    return "Cable TV";
  };

  const getHeaderSubtitle = (): string => {
    if (step === "purchase") return "Review and confirm your subscription";
    if (step === "verify") return "Verify your smartcard to continue";
    return "Choose a provider and subscription plan";
  };

  const primaryAccount = dashboardData?.accounts?.[0];

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Fixed on mobile, normal flow on desktop */}
      <div className="fixed lg:static top-0 left-0 right-0 lg:inset-auto z-10 bg-dashboard-bg pb-4 sm:pb-5 lg:pb-0">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-dashboard-surface border-b border-dashboard-border/60"
        >
          <div className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 shrink-0 rounded-xl text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-border/50 sm:h-10 sm:w-10"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-quick-action-5-bg text-quick-action-5 sm:h-9 sm:w-9">
                  <Tv className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                </span>
                {getHeaderTitle()}
              </h1>
              <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
                {getHeaderSubtitle()}
              </p>
            </div>
          </div>
        </motion.header>

        <div className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8 space-y-5 sm:space-y-6">
          {dashboardData && (
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
          )}

          {step === "select" && (
            <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8 max-w-xl">
              <label className="label-auth mb-3 block text-dashboard-heading">
                Select provider
              </label>
              {servicesError && (
                <div className="mb-4">
                  <FormError message={servicesError} />
                </div>
              )}
              <ProviderSelector
                services={allServices}
                selectedServiceId={selectedServiceId}
                onSelect={setSelectedServiceId}
                isLoading={loadingServices}
              />
            </div>
          )}
        </div>
      </div>

      {/* Spacer for fixed header on mobile only */}
      <div
        className={`shrink-0 lg:hidden ${step === "select" ? "h-[280px] sm:h-[300px]" : "h-[200px] sm:h-[220px]"}`}
        aria-hidden
      />

      {/* Scrollable content */}
      <div className="px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 sm:space-y-6 overflow-x-hidden">
        <section className="hidden sm:block max-w-4xl w-full min-w-0">
          <WalletAnalysisCards />
        </section>

        {/* Step: Select provider + plan */}
        {step === "select" && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="max-w-xl w-full min-w-0 space-y-4 sm:space-y-5"
          >
            {/* Plan selector */}
            {selectedServiceId && (
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                {variationsError && (
                  <div className="mb-4">
                    <FormError message={variationsError} />
                  </div>
                )}
                <PlanSelector
                  variationCodes={variationCodes}
                  isLoading={loadingVariations}
                  error={variationsError}
                  onSelectPlan={handleSelectPlan}
                  selectedVariationCode={selectedVariation?.variation_code || null}
                />
              </div>
            )}
          </motion.section>
        )}

        {/* Step: Verify smartcard (DSTV/GOTV/Startimes only) */}
        {step === "verify" && selectedServiceId && selectedService && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="max-w-xl w-full min-w-0"
          >
            <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
              {/* Selected plan summary */}
              {selectedVariation && (
                <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 mb-5 sm:mb-6">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const logo = getNetworkLogo(selectedServiceId) || selectedService.image;
                      return logo ? (
                        <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
                          <Image src={logo} alt={selectedService.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : null;
                    })()}
                    <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Provider</p>
                        <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                          {selectedService.name.replace(" Subscription", "")}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Plan</p>
                        <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                          {selectedVariation.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Amount</p>
                        <p className="text-base sm:text-lg font-bold text-brand-bg-primary tabular-nums">
                          ₦{parseFloat(selectedVariation.variation_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <SmartcardVerificationForm
                serviceID={selectedServiceId}
                serviceName={selectedService.name}
                onVerified={handleVerificationSuccess}
                onError={() => {}}
              />
            </div>

            {/* Skip verification for Startimes (optional) */}
            {isStartimes && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep("purchase")}
                  className="text-xs sm:text-sm text-brand-bg-primary hover:underline touch-manipulation"
                >
                  Skip verification and proceed to purchase
                </button>
              </div>
            )}
          </motion.section>
        )}

        {/* Step: Purchase */}
        {step === "purchase" && selectedServiceId && selectedService && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="max-w-xl w-full min-w-0"
          >
            <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
              {/* Selected plan summary */}
              {selectedVariation && (
                <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 mb-5 sm:mb-6">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const logo = getNetworkLogo(selectedServiceId) || selectedService.image;
                      return logo ? (
                        <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
                          <Image src={logo} alt={selectedService.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : null;
                    })()}
                    <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Provider</p>
                        <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                          {selectedService.name.replace(" Subscription", "")}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Plan</p>
                        <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                          {selectedVariation.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Amount</p>
                        <p className="text-base sm:text-lg font-bold text-brand-bg-primary tabular-nums">
                          ₦{parseFloat(selectedVariation.variation_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification badge */}
                  {verificationData && (
                    <div className="mt-3 pt-3 border-t border-dashboard-border/60 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <p className="text-[10px] sm:text-xs text-dashboard-muted">
                        Verified: <strong className="text-dashboard-heading">{verificationData.Customer_Name}</strong>
                        {verificationData.Current_Bouquet && (
                          <> — {verificationData.Current_Bouquet}</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <CablePurchaseForm
                selectedServiceId={selectedServiceId}
                selectedVariation={selectedVariation}
                serviceName={selectedService.name}
                verificationData={verificationData || undefined}
                verifiedSmartcardNumber={verifiedSmartcardNumber}
                onSuccess={handleTransactionSuccess}
                onError={handleTransactionError}
                walletBalance={walletBalance}
                cashbackBalance={cashbackBalance}
                cashbackPercent={cashbackPercent}
              />
            </div>
          </motion.section>
        )}
      </div>

      {/* Transaction Status Modal */}
      {transactionStatus && (
        <TransactionStatusModal
          isOpen={!!transactionStatus}
          onClose={handleModalClose}
          status={transactionStatus}
          transactionData={transactionData || undefined}
          errorMessage={errorMessage || undefined}
          onRetry={handleRetry}
          serviceID={selectedServiceId || undefined}
        />
      )}
    </div>
  );
}
