"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { WalletCard } from "@/components/dashboard/WalletCard";
import {
  PhoneCall,
  ArrowLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import { FormError } from "@/components/auth/FormError";
import {
  useIntlAirtimeCountries,
  useIntlAirtimeProductTypes,
  useIntlAirtimeOperators,
  useIntlAirtimeVariations,
} from "@/hooks/vtpass/vtu/useInternationalAirtime";
import { vtpassInternationalAirtimeApi } from "@/services/vtpass/vtu/vtpass-international-airtime-api";
import { TransactionStatusModal } from "../intl-airtime-components/intl-airtime/TransactionStatusModal";
import { PurchaseConfirmationModal } from "../intl-airtime-components/intl-airtime/PurchaseConfirmationModal";
import type {
  IntlAirtimeVariation,
  IntlAirtimePurchaseResponse,
  IntlAirtimeQueryResponse,
} from "@/types/vtpass/vtu/vtpass-international-airtime";
import { motion, AnimatePresence } from "motion/react";

type Step = "countries" | "product-types" | "operators" | "variations" | "purchase";

export default function VtpassInternationalAirtimePage() {
  const router = useRouter();
  const { dashboardData, refetch } = useDashboard();

  const [step, setStep] = useState<Step>("countries");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<string | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedOperatorName, setSelectedOperatorName] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<IntlAirtimeVariation | null>(null);

  const [beneficiaryNumber, setBeneficiaryNumber] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "success" | "processing" | "error" | null
  >(null);
  const [transactionData, setTransactionData] = useState<IntlAirtimePurchaseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRequestId, setLastRequestId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const countriesState = useIntlAirtimeCountries();
  const productTypesState = useIntlAirtimeProductTypes(selectedCountryCode);
  const operatorsState = useIntlAirtimeOperators(selectedCountryCode, selectedProductTypeId);
  const variationsState = useIntlAirtimeVariations(selectedOperatorId, selectedProductTypeId);

  const walletBalance = dashboardData
    ? parseFloat(dashboardData.wallet_card.current_balance.replace(/,/g, ""))
    : 0;
  const cashbackBalance = dashboardData?.cashback_wallet?.current_balance;
  const intlCbRate = dashboardData?.cashback_rates?.find(
    (r) =>
      (r.service === "international_airtime" || r.service === "intl_airtime") &&
      r.is_active
  );
  const cashbackPercent = intlCbRate?.percentage;
  const primaryAccount = dashboardData?.accounts?.[0];

  const selectedCountry = countriesState.data?.countries.find(
    (c) => c.code === selectedCountryCode
  );
  const selectedProductType = productTypesState.data?.find(
    (p) => String(p.product_type_id) === selectedProductTypeId
  );

  const handleBack = () => {
    if (step === "purchase") {
      setStep("variations");
      return;
    }
    if (step === "variations") {
      setStep("operators");
      return;
    }
    if (step === "operators") {
      setStep("product-types");
      return;
    }
    if (step === "product-types") {
      setStep("countries");
      return;
    }
    router.push("/dashboard");
  };

  const parsedAmount = (() => {
    if (amountInput) {
      const n = parseFloat(amountInput);
      return isNaN(n) ? 0 : n;
    }
    if (selectedVariation) {
      const v = parseFloat(selectedVariation.variation_amount);
      return isNaN(v) ? 0 : v;
    }
    return 0;
  })();

  const validatePurchase = (): boolean => {
    const errs: Record<string, string> = {};

    if (!beneficiaryNumber) {
      errs.beneficiary = "Destination phone is required";
    }

    if (!customerPhone) {
      errs.customerPhone = "Customer phone is required";
    } else if (customerPhone.length < 7) {
      errs.customerPhone = "Enter a valid phone number";
    }

    if (!parsedAmount || parsedAmount <= 0) {
      errs.amount = "Enter a valid amount in NGN";
    }

    const cbNum = cashbackBalance
      ? parseFloat(cashbackBalance.replace(/[₦,]/g, "")) || 0
      : 0;
    const maxCbDeduction = cbNum > 0 ? Math.min(cbNum, parsedAmount) : 0;
    const minFromWallet = parsedAmount - maxCbDeduction;
    if (parsedAmount > 0 && minFromWallet > walletBalance) {
      setServerError("Insufficient wallet balance. Please top up.");
      setFormErrors(errs);
      return false;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!selectedCountryCode || !selectedProductTypeId || !selectedOperatorId || !selectedVariation)
      return;
    if (!validatePurchase()) return;
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = async (useCashback: boolean) => {
    if (!selectedCountryCode || !selectedProductTypeId || !selectedOperatorId || !selectedVariation)
      return;
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
      const randomStr = Math.random().toString(36).substring(2, 10);
      const requestId = `${dateStr}${randomStr}`;

      const response = await vtpassInternationalAirtimeApi.purchase({
        serviceID: "foreign-airtime",
        billersCode: beneficiaryNumber,
        variation_code: selectedVariation.variation_code,
        ...(parsedAmount ? { amount: parsedAmount } : {}),
        phone: customerPhone,
        operator_id: selectedOperatorId,
        country_code: selectedCountryCode,
        product_type_id: selectedProductTypeId,
        request_id: requestId,
        ...(useCashback ? { use_cashback: true } : {}),
      });

      if (response.success) {
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

  const handleTransactionResult = async (data: IntlAirtimePurchaseResponse) => {
    const txStatus = data.content?.transactions?.status;
    const code = data.code;

    if (
      data.status === "processing" ||
      txStatus === "pending" ||
      txStatus === "initiated" ||
      code === "099"
    ) {
      setTransactionData(data);
      setTransactionStatus("processing");
      refetch();
      return;
    }

    if (
      code === "016" ||
      code === "040" ||
      txStatus === "failed" ||
      txStatus === "reversed"
    ) {
      setTransactionData(data);
      setTransactionStatus("error");
      setErrorMessage(
        data.response_description || "Transaction failed. Your wallet has been refunded."
      );
      refetch();
      return;
    }

    if (data.id) {
      await refetch();
      router.replace(`/dashboard/transactions/${data.id}`);
      return;
    }

    refetch();
    setTransactionData(data);
    setTransactionStatus(txStatus === "delivered" ? "success" : "processing");
  };

  const handleStatusUpdate = useCallback(
    (data: IntlAirtimeQueryResponse["data"]) => {
      const txStatus = data.content?.transactions?.status;
      const code = data.code;

      if (code === "000" && txStatus === "delivered") {
        setTransactionStatus("success");
      } else if (
        code === "016" ||
        code === "040" ||
        txStatus === "failed" ||
        txStatus === "reversed"
      ) {
        setTransactionStatus("error");
        setErrorMessage("Transaction failed. Your wallet has been refunded.");
      }
      refetch();
    },
    [refetch]
  );

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

  const getHeaderTitle = (): string => {
    if (step === "purchase") return "Complete Purchase";
    if (step === "variations") return "Choose Plan";
    if (step === "operators") return "Choose Operator";
    if (step === "product-types") return "Choose Product Type";
    return "International Airtime";
  };

  const getHeaderSubtitle = (): string => {
    if (step === "purchase") return "Enter beneficiary details and confirm";
    if (step === "variations") return "Select a top-up or data plan";
    if (step === "operators") return "Select mobile operator";
    if (step === "product-types") return "Select what you want to buy";
    return "Top up numbers in other countries";
  };

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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-quick-action-2-bg text-quick-action-2 sm:h-9 sm:w-9">
                  <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                </span>
                {getHeaderTitle()}
              </h1>
              <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
                {getHeaderSubtitle()}
              </p>
            </div>
          </div>
        </motion.header>

        {/* Wallet card — always visible in fixed area */}
        {dashboardData && (
          <div className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
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
      <div className="h-[220px] sm:h-[240px]" aria-hidden />

      {/* Scrollable content */}
      <div className="px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 sm:space-y-6 overflow-x-hidden">
        <section className="hidden sm:block max-w-4xl w-full min-w-0">
          <WalletAnalysisCards />
        </section>

        <AnimatePresence mode="wait">
          {/* Step 1: Countries */}
          {step === "countries" && (
            <motion.section
              key="countries"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8">
                  <label className="label-auth mb-4 block text-dashboard-heading">
                    Select country
                  </label>
                  {countriesState.error && <FormError message={countriesState.error} />}
                  {countriesState.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-bg-primary" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {countriesState.data?.countries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountryCode(country.code);
                            setSelectedProductTypeId(null);
                            setSelectedOperatorId(null);
                            setSelectedOperatorName(null);
                            setSelectedVariation(null);
                            setStep("product-types");
                          }}
                          className="w-full flex items-center gap-3.5 p-4 rounded-xl border-2 border-dashboard-border/80 bg-dashboard-surface hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03] transition-all text-left touch-manipulation"
                        >
                          {country.flag ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-dashboard-border/40 shrink-0 bg-dashboard-bg">
                              <Image
                                src={country.flag}
                                alt={country.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-quick-action-2-bg text-quick-action-2">
                              <Globe2 className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-dashboard-heading truncate">
                              {country.name}
                            </p>
                            <p className="text-[11px] text-dashboard-muted mt-0.5 truncate">
                              +{country.prefix} · {country.currency}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-dashboard-muted/40 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* Step 2: Product types */}
          {step === "product-types" && selectedCountry && (
            <motion.section
              key="product-types"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-dashboard-border/40 shrink-0 bg-dashboard-bg">
                    {selectedCountry.flag ? (
                      <Image
                        src={selectedCountry.flag}
                        alt={selectedCountry.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Globe2 className="h-5 w-5 m-2 text-quick-action-2" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-dashboard-muted">Country</p>
                    <p className="text-sm font-semibold text-dashboard-heading">
                      {selectedCountry.name}
                    </p>
                  </div>
                </div>

                <label className="label-auth mb-3 block text-dashboard-heading">
                  Select product type
                </label>

                {productTypesState.error && (
                  <div className="mb-3">
                    <FormError message={productTypesState.error} />
                  </div>
                )}

                {productTypesState.isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-bg-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productTypesState.data?.map((type) => (
                      <button
                        key={type.product_type_id}
                        onClick={() => {
                          setSelectedProductTypeId(String(type.product_type_id));
                          setSelectedOperatorId(null);
                          setSelectedOperatorName(null);
                          setSelectedVariation(null);
                          setStep("operators");
                        }}
                        className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashboard-border/80 bg-dashboard-surface hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03] transition-all text-left touch-manipulation"
                      >
                        <span className="font-semibold text-sm text-dashboard-heading">
                          {type.name}
                        </span>
                        <ChevronRight className="h-4 w-4 text-dashboard-muted/40 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Step 3: Operators */}
          {step === "operators" && selectedCountry && selectedProductType && (
            <motion.section
              key="operators"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-dashboard-border/40 shrink-0 bg-dashboard-bg">
                      {selectedCountry.flag ? (
                        <Image
                          src={selectedCountry.flag}
                          alt={selectedCountry.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Globe2 className="h-4 w-4 m-2 text-quick-action-2" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-dashboard-muted">Country</p>
                      <p className="text-sm font-semibold text-dashboard-heading">
                        {selectedCountry.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-dashboard-muted">Product type</p>
                    <p className="text-xs font-semibold text-dashboard-heading">
                      {selectedProductType.name}
                    </p>
                  </div>
                </div>

                <label className="label-auth mb-3 block text-dashboard-heading">
                  Select operator
                </label>

                {operatorsState.error && (
                  <div className="mb-3">
                    <FormError message={operatorsState.error} />
                  </div>
                )}

                {operatorsState.isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-bg-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {operatorsState.data?.map((op) => (
                      <button
                        key={op.operator_id}
                        onClick={() => {
                          setSelectedOperatorId(op.operator_id);
                          setSelectedOperatorName(op.name);
                          setSelectedVariation(null);
                          setStep("variations");
                        }}
                        className="w-full flex items-center gap-3.5 p-4 rounded-xl border-2 border-dashboard-border/80 bg-dashboard-surface hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03] transition-all text-left touch-manipulation"
                      >
                        {op.operator_image ? (
                          <div className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-dashboard-border/40 shrink-0 bg-dashboard-bg">
                            <Image
                              src={op.operator_image}
                              alt={op.name}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-quick-action-2-bg text-quick-action-2">
                            <PhoneCall className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-dashboard-heading truncate">
                            {op.name}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-dashboard-muted/40 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Step 4: Variations */}
          {step === "variations" && selectedCountry && selectedProductType && selectedOperatorId && (
            <motion.section
              key="variations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-dashboard-muted">Operator</p>
                    <p className="text-sm font-semibold text-dashboard-heading truncate">
                      {selectedOperatorName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-dashboard-muted">Country</p>
                    <p className="text-xs font-semibold text-dashboard-heading">
                      {selectedCountry.name}
                    </p>
                  </div>
                </div>

                <label className="label-auth mb-3 block text-dashboard-heading">
                  Select plan
                </label>

                {variationsState.error && (
                  <div className="mb-3">
                    <FormError message={variationsState.error} />
                  </div>
                )}

                {variationsState.isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-bg-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variationsState.data?.variations.map((variation) => {
                      const isSelected =
                        selectedVariation?.variation_code === variation.variation_code;
                      const amount = parseFloat(variation.variation_amount);
                      const hasFixedAmount = !isNaN(amount) && amount > 0;
                      return (
                        <button
                          key={variation.variation_code}
                          onClick={() => {
                            setSelectedVariation(variation);
                            setStep("purchase");
                          }}
                          className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all text-left touch-manipulation ${
                            isSelected
                              ? "border-brand-bg-primary bg-brand-bg-primary/[0.06]"
                              : "border-dashboard-border/80 bg-dashboard-surface hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-dashboard-heading truncate">
                              {variation.name}
                            </p>
                            <p className="text-[10px] text-dashboard-muted mt-0.5">
                              {hasFixedAmount
                                ? "Fixed price"
                                : "Amount will be computed based on rate"}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-brand-bg-primary tabular-nums shrink-0">
                            {hasFixedAmount ? `₦${amount.toLocaleString()}` : "Flexible"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Step 5: Purchase form */}
          {step === "purchase" && selectedCountry && selectedProductType && selectedVariation && (
            <motion.section
              key="purchase"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                {/* Recap card */}
                <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 mb-5 sm:mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-dashboard-border/40 shrink-0 bg-dashboard-bg">
                      {selectedCountry.flag ? (
                        <Image
                          src={selectedCountry.flag}
                          alt={selectedCountry.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Globe2 className="h-4 w-4 m-2 text-quick-action-2" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-dashboard-muted mb-0.5">Destination</p>
                      <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                        {selectedCountry.name} · {selectedProductType.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-dashboard-muted mb-0.5">Plan</p>
                      <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                        {selectedVariation.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-dashboard-muted mb-0.5">Amount</p>
                      <p className="text-base sm:text-lg font-bold text-dashboard-heading tabular-nums">
                        {parsedAmount > 0 ? `₦${parsedAmount.toLocaleString()}` : "Flexible"}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitPurchase} className="space-y-5 sm:space-y-6">
                  {/* Beneficiary number */}
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
                      Destination Phone (beneficiary) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-dashboard-muted px-3 py-2 rounded-xl bg-dashboard-bg border border-dashboard-border/70">
                        +{selectedCountry.prefix}
                      </span>
                      <input
                        type="tel"
                        placeholder="Enter number without country code"
                        value={beneficiaryNumber}
                        onChange={(e) => {
                          const input = e.target.value.replace(/\\s/g, "");
                          setBeneficiaryNumber(input);
                          setFormErrors((p) => ({ ...p, beneficiary: "" }));
                        }}
                        disabled={isSubmitting}
                        className="flex-1 bg-transparent text-sm sm:text-base py-2 border-0 border-b-2 border-dashboard-border focus:border-brand-bg-primary focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading"
                      />
                    </div>
                    {formErrors.beneficiary && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{formErrors.beneficiary}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer phone */}
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
                      Your Phone (for notifications) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="08012345678"
                      value={customerPhone}
                      onChange={(e) => {
                        const input = e.target.value.replace(/\\D/g, "");
                        setCustomerPhone(input.slice(0, 15));
                        setFormErrors((p) => ({ ...p, customerPhone: "" }));
                      }}
                      disabled={isSubmitting}
                      className={`w-full bg-transparent text-sm sm:text-base py-2 border-0 border-b-2 focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading ${
                        formErrors.customerPhone
                          ? "border-red-500"
                          : customerPhone
                          ? "border-green-500"
                          : "border-dashboard-border focus:border-brand-bg-primary"
                      }`}
                    />
                    {formErrors.customerPhone && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{formErrors.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount input (optional but recommended) */}
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
                      Amount in NGN{" "}
                      <span className="text-dashboard-muted text-[10px]">(required for now)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-dashboard-muted">
                        ₦
                      </span>
                      <input
                        type="tel"
                        placeholder={selectedVariation.variation_amount === "0.00" ? "Enter amount" : selectedVariation.variation_amount}
                        value={amountInput}
                        onChange={(e) => {
                          const input = e.target.value.replace(/[^\\d.]/g, "");
                          setAmountInput(input);
                          setFormErrors((p) => ({ ...p, amount: "" }));
                        }}
                        disabled={isSubmitting}
                        className="w-full bg-transparent text-sm sm:text-base py-2 pl-4 border-0 border-b-2 border-dashboard-border focus:border-brand-bg-primary focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading"
                      />
                    </div>
                    {formErrors.amount && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{formErrors.amount}</span>
                      </div>
                    )}
                  </div>

                  {serverError && <FormError message={serverError} />}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-12 h-12 sm:min-h-[52px] sm:h-[52px] rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-base sm:text-lg font-semibold shadow-sm transition-all active:scale-[0.99] touch-manipulation"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      "Purchase International Airtime"
                    )}
                  </Button>

                  <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/80 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-dashboard-muted">
                      <strong className="text-dashboard-heading">Note:</strong>{" "}
                      International airtime is credited directly to the destination phone. No PIN is
                      returned. Keep your transaction reference safe in case you need support.
                    </p>
                  </div>
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {showConfirmation &&
        selectedCountry &&
        selectedProductType &&
        selectedVariation && (
          <PurchaseConfirmationModal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={handleConfirmPurchase}
            countryName={selectedCountry.name}
            countryFlag={selectedCountry.flag}
            productTypeName={selectedProductType.name}
            variationName={selectedVariation.name}
            beneficiaryNumber={beneficiaryNumber}
            countryPrefix={selectedCountry.prefix}
            amount={parsedAmount}
            walletBalance={walletBalance}
            cashbackBalance={cashbackBalance}
            cashbackPercent={cashbackPercent}
            isLoading={isSubmitting}
          />
        )}

      {transactionStatus && (
        <TransactionStatusModal
          isOpen={!!transactionStatus}
          onClose={handleModalClose}
          status={transactionStatus}
          transactionData={transactionData || undefined}
          errorMessage={errorMessage || undefined}
          onRetry={handleRetry}
          requestId={lastRequestId}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

