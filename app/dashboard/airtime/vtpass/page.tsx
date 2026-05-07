"use client";

import { useState } from "react";
import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { AirtimeForm } from "@/app/dashboard/airtime/airtime-components/airtime/AirtimeForm";
import { TransactionStatusModal } from "@/app/dashboard/airtime/airtime-components/airtime/TransactionStatusModal";
import { Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import type { VtpassPurchaseResponse } from "@/services/vtpass/vtu/vtpass-airtime-api";
import { motion } from "motion/react";

export default function VtpassAirtimePage() {
  const router = useRouter();

  // const { user } = useAuth();
  const { dashboardData, refetch } = useDashboard();
  const [transactionStatus, setTransactionStatus] = useState<
    "success" | "processing" | "error" | null
  >(null);
  const [transactionData, setTransactionData] = useState<VtpassPurchaseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const walletBalance = dashboardData
    ? parseFloat(dashboardData.wallet_card.current_balance.replace(/,/g, ""))
    : 0;

  const cashbackBalance = dashboardData?.cashback_wallet?.current_balance;
  const airtimeCbRate = dashboardData?.cashback_rates?.find(
    (r) => r.service === "airtime" && r.is_active
  );
  const cashbackPercent = airtimeCbRate?.percentage;

  const handleTransactionSuccess = async (data: VtpassPurchaseResponse) => {
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

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Fixed on mobile, normal flow on desktop */}
      <div className="fixed lg:static top-0 left-0 right-0 lg:inset-auto z-20 bg-dashboard-bg pb-4 sm:pb-5 lg:pb-0">
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
              onClick={() => router.push("/dashboard")}
              className="h-9 w-9 shrink-0 rounded-xl text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-border/50 sm:h-10 sm:w-10"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-quick-action-3-bg text-quick-action-3 sm:h-9 sm:w-9">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                </span>
                Buy Airtime
              </h1>
              <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
                Top up any network instantly
              </p>
            </div>
          </div>
        </motion.header>

        {/* Compact wallet card — always visible in fixed area */}
        {dashboardData && (
          <div className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
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
          </div>
        )}
      </div>

      {/* Spacer for fixed header on mobile only */}
      <div className="h-[220px] sm:h-[240px] lg:hidden" aria-hidden />

      {/* Scrollable content */}
      <div className="px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 sm:space-y-6 overflow-x-hidden">
        <section className="hidden sm:block max-w-4xl w-full min-w-0">
          <WalletAnalysisCards />
        </section>

        {/* Main form card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="max-w-xl w-full min-w-0"
        >
          <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface shadow-sm p-4 sm:p-6">
            <AirtimeForm
              onSuccess={handleTransactionSuccess}
              onError={handleTransactionError}
              walletBalance={walletBalance}
              cashbackBalance={cashbackBalance}
              cashbackPercent={cashbackPercent}
            />
          </div>
        </motion.section>
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
