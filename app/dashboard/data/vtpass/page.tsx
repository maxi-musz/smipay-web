"use client";

import { useState, useEffect } from "react";
import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { Wifi, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { NetworkSelector } from "../data-components/data/NetworkSelector";
import { DataPlanSelector } from "../data-components/data/DataPlanSelector";
import { DataPurchaseForm } from "../data-components/data/DataPurchaseForm";
import { TransactionStatusModal } from "../data-components/data/TransactionStatusModal";
import { useVtpassDataServiceIds } from "@/hooks/vtpass/vtu/useVtpassDataServiceIds";
import { useVtpassDataVariationCodes } from "@/hooks/vtpass/vtu/useVtpassDataVariationCodes";
import { useDashboard } from "@/hooks/useDashboard";
import { FormError } from "@/components/auth/FormError";
import { getLastUsed } from "@/lib/recent-numbers";
import type { VtpassDataVariation, VtpassDataPurchaseResponse } from "@/types/vtpass/vtu/vtpass-data";
import { motion } from "motion/react";

export default function VtpassDataPage() {
  const router = useRouter();
  const { dashboardData, refetch } = useDashboard();
  const { serviceIds: allServices, isLoading: loadingServices, error: servicesError } = useVtpassDataServiceIds();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedVariationCode, setSelectedVariationCode] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<VtpassDataVariation | null>(null);
  const [showPurchaseView, setShowPurchaseView] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"success" | "processing" | "error" | null>(null);
  const [transactionData, setTransactionData] = useState<VtpassDataPurchaseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { variationCodes, isLoading: loadingVariations, error: variationsError } = useVtpassDataVariationCodes(selectedServiceId);

  const walletBalance = dashboardData
    ? parseFloat(dashboardData.wallet_card.current_balance.replace(/,/g, ""))
    : 0;
  const cashbackBalance = dashboardData?.cashback_wallet?.current_balance;
  const dataCbRate = dashboardData?.cashback_rates?.find(
    (r) => r.service === "data" && r.is_active
  );
  const cashbackPercent = dataCbRate?.percentage;

  const services = allServices.filter((service) => {
    const standardProviders = ["mtn-data", "glo-data", "airtel-data", "etisalat-data"];
    return standardProviders.includes(service.serviceID);
  });

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      const last = getLastUsed("data");
      if (last && services.some((s) => s.serviceID === last.serviceID)) {
        queueMicrotask(() => setSelectedServiceId(last.serviceID));
      } else {
        queueMicrotask(() => setSelectedServiceId(services[0].serviceID));
      }
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedVariationCode(null);
      setSelectedVariation(null);
      setShowPurchaseView(false);
    });
  }, [selectedServiceId]);

  const handleSelectPlan = (variation: VtpassDataVariation) => {
    setSelectedVariationCode(variation.variation_code);
    setSelectedVariation(variation);
    setShowPurchaseView(true);
  };

  const handleBackToPlans = () => {
    setShowPurchaseView(false);
  };

  const handleTransactionSuccess = async (data: VtpassDataPurchaseResponse) => {
    const isError =
      data.code !== "000" &&
      data.status !== "processing" &&
      data.content?.transactions?.status !== "pending" &&
      data.content?.transactions?.status !== "initiated" &&
      data.content?.transactions?.status !== "delivered";

    if (isError) {
      setTransactionData(data);
      setTransactionStatus("error");
      setErrorMessage(data.response_description || "Transaction failed");
      refetch();
      return;
    }

    if (data.id) {
      await refetch();
      router.replace(`/dashboard/transactions/${data.id}`);
    } else {
      refetch();
      setTransactionData(data);
      setTransactionStatus(
        data.content?.transactions?.status === "delivered" ? "success" : "processing"
      );
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

  const getSelectedVariation = (): VtpassDataVariation | null => {
    if (!selectedVariationCode || !variationCodes) return null;
    const allVariations = Object.values(variationCodes.variations_categorized).flatMap((cat) => cat.variations);
    return allVariations.find((v) => v.variation_code === selectedVariationCode) || null;
  };

  const currentVariation = selectedVariation || getSelectedVariation();
  const selectedService = services.find((s) => s.serviceID === selectedServiceId);

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
              onClick={() => showPurchaseView ? handleBackToPlans() : router.push("/dashboard")}
              className="h-9 w-9 shrink-0 rounded-xl text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-border/50 sm:h-10 sm:w-10"
              aria-label={showPurchaseView ? "Back to plans" : "Back to dashboard"}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-quick-action-2-bg text-quick-action-2 sm:h-9 sm:w-9">
                  <Wifi className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                </span>
                {showPurchaseView ? "Complete Purchase" : "Buy Data"}
              </h1>
              <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
                {showPurchaseView ? "Enter phone number and confirm" : "Choose a network and data plan"}
              </p>
            </div>
          </div>
        </motion.header>

        <div className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
          {dashboardData && (
            <section className="max-w-xl w-full min-w-0">
              <WalletCard
                bankName={dashboardData.accounts[0]?.bank_name}
                accountNumber={dashboardData.accounts[0]?.account_number}
                accountHolderName={dashboardData.accounts[0]?.account_holder_name}
                balance={walletBalance}
                isActive={dashboardData.accounts[0]?.isActive ?? true}
                compact
              />
            </section>
          )}
        </div>
      </div>

      {/* Spacer for fixed header on mobile only */}
      <div
        className={`shrink-0 lg:hidden ${showPurchaseView ? "h-[200px] sm:h-[220px]" : "h-[220px] sm:h-[240px]"}`}
        aria-hidden
      />

      {/* Scrollable content */}
      <div className="px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 sm:space-y-6 overflow-x-hidden">
        <section className="hidden sm:block max-w-4xl w-full min-w-0">
          <WalletAnalysisCards />
        </section>

        {!showPurchaseView ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="max-w-xl w-full min-w-0 space-y-4 sm:space-y-5"
          >
            {/* Select network — now scrolls with plans for more browsing space on mobile */}
            <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
              <label className="label-auth mb-3 block text-dashboard-heading">
                Select network
              </label>
              {servicesError && (
                <div className="mb-4">
                  <FormError message={servicesError} />
                </div>
              )}
              <NetworkSelector
                services={services}
                selectedServiceId={selectedServiceId}
                onSelect={setSelectedServiceId}
                isLoading={loadingServices}
              />
            </div>

            {/* Data Plans */}
            {selectedServiceId && (
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                {variationsError && (
                  <div className="mb-4">
                    <FormError message={variationsError} />
                  </div>
                )}
                <DataPlanSelector
                  variationCodes={variationCodes}
                  isLoading={loadingVariations}
                  error={variationsError}
                  onSelectPlan={handleSelectPlan}
                  selectedVariationCode={selectedVariationCode}
                />
              </div>
            )}
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="max-w-xl w-full min-w-0"
          >
            <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
              {/* Selected Plan Summary */}
              {currentVariation && selectedService && (
                <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 mb-5 sm:mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Network</p>
                      <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                        {selectedService.name.replace(" Data", "").replace(" (SME)", "")}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Plan</p>
                      <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">{currentVariation.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">Amount</p>
                      <p className="text-base sm:text-lg font-bold text-brand-bg-primary">
                        ₦{parseFloat(currentVariation.variation_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentVariation && selectedServiceId && selectedService && (
                <DataPurchaseForm
                  selectedServiceId={selectedServiceId}
                  selectedVariation={currentVariation}
                  serviceName={selectedService.name}
                  serviceImage={selectedService.image}
                  onSuccess={handleTransactionSuccess}
                  onError={handleTransactionError}
                  walletBalance={walletBalance}
                  cashbackBalance={cashbackBalance}
                  cashbackPercent={cashbackPercent}
                />
              )}
            </div>
          </motion.section>
        )}
      </div>

      {transactionStatus && (
        <TransactionStatusModal
          isOpen={!!transactionStatus}
          onClose={handleModalClose}
          status={transactionStatus}
          transactionData={transactionData || undefined}
          errorMessage={errorMessage || undefined}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
