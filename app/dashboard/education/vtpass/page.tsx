"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { WalletCard } from "@/components/dashboard/WalletCard";
import {
  GraduationCap,
  ArrowLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useVtpassEducationVariations } from "@/hooks/vtpass/vtu/useVtpassEducationVariations";
import { useDashboard } from "@/hooks/useDashboard";
import { FormError } from "@/components/auth/FormError";
import { vtpassEducationApi } from "@/services/vtpass/vtu/vtpass-education-api";
import { PurchaseConfirmationModal } from "../education-components/education/PurchaseConfirmationModal";
import { TransactionStatusModal } from "../education-components/education/TransactionStatusModal";
import type {
  EducationServiceID,
  VtpassEducationVariation,
  VtpassEducationPurchaseResponse,
} from "@/types/vtpass/vtu/vtpass-education";
import { getNetworkLogo } from "@/lib/network-logos";
import { motion, AnimatePresence } from "motion/react";

interface EducationProduct {
  id: EducationServiceID;
  name: string;
  shortName: string;
  description: string;
  hasVerify: boolean;
  hasQuantity: boolean;
}

const EDUCATION_PRODUCTS: EducationProduct[] = [
  {
    id: "waec-registration",
    name: "WAEC Registration PIN",
    shortName: "WAEC Registration",
    description: "Purchase WAEC registration PIN for private candidates",
    hasVerify: false,
    hasQuantity: true,
  },
  {
    id: "waec",
    name: "WAEC Result Checker PIN",
    shortName: "WAEC Result Checker",
    description: "Purchase WAEC result checker PIN (serial + PIN)",
    hasVerify: false,
    hasQuantity: true,
  },
  {
    id: "jamb",
    name: "JAMB PIN",
    shortName: "JAMB",
    description: "Purchase JAMB UTME & Direct Entry PIN",
    hasVerify: true,
    hasQuantity: false,
  },
];

type Step = "products" | "variations" | "verify" | "purchase";

export default function VtpassEducationPage() {
  const router = useRouter();
  const { dashboardData, refetch } = useDashboard();

  const [selectedProduct, setSelectedProduct] = useState<EducationProduct | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<VtpassEducationVariation | null>(null);
  const [step, setStep] = useState<Step>("products");

  // JAMB verification
  const [profileId, setProfileId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");
  const [verifyError, setVerifyError] = useState("");

  // Purchase form
  const [phoneNumber, setPhoneNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Transaction status
  const [transactionStatus, setTransactionStatus] = useState<"success" | "processing" | "error" | null>(null);
  const [transactionData, setTransactionData] = useState<VtpassEducationPurchaseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRequestId, setLastRequestId] = useState("");

  const {
    variations: variationsData,
    isLoading: loadingVariations,
    error: variationsError,
  } = useVtpassEducationVariations(selectedProduct?.id || null);

  const walletBalance = dashboardData
    ? parseFloat(dashboardData.wallet_card.current_balance.replace(/,/g, ""))
    : 0;
  const cashbackBalance = dashboardData?.cashback_wallet?.current_balance;
  const educationCbRate = dashboardData?.cashback_rates?.find(
    (r) => r.service === "education" && r.is_active
  );
  const cashbackPercent = educationCbRate?.percentage;

  const handleSelectProduct = (product: EducationProduct) => {
    setSelectedProduct(product);
    setSelectedVariation(null);
    setStep("variations");
    setProfileId("");
    setVerifiedName("");
    setVerifyError("");
    setPhoneNumber("");
    setQuantity(1);
    setFormErrors({});
    setServerError("");
  };

  const handleSelectVariation = (variation: VtpassEducationVariation) => {
    setSelectedVariation(variation);
    if (selectedProduct?.hasVerify) {
      setStep("verify");
    } else {
      setStep("purchase");
    }
  };

  const handleVerifyJamb = async () => {
    if (!profileId.trim()) {
      setVerifyError("Please enter your JAMB Profile ID");
      return;
    }
    if (!selectedVariation) return;

    setIsVerifying(true);
    setVerifyError("");
    setVerifiedName("");

    try {
      const response = await vtpassEducationApi.verifyJamb({
        billersCode: profileId.trim(),
        type: selectedVariation.variation_code,
      });

      if (response.success && response.data?.content?.Customer_Name) {
        setVerifiedName(response.data.content.Customer_Name);
        setStep("purchase");
      } else {
        setVerifyError(response.message || "Could not verify JAMB Profile ID. Please check and try again.");
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    if (step === "purchase" && selectedProduct?.hasVerify) {
      setStep("verify");
    } else if (step === "purchase" || step === "verify") {
      setStep("variations");
    } else if (step === "variations") {
      setStep("products");
      setSelectedProduct(null);
      setSelectedVariation(null);
    } else {
      router.push("/dashboard");
    }
  };

  const unitPrice = selectedVariation
    ? parseFloat(selectedVariation.variation_amount)
    : 0;
  const totalAmount = unitPrice * quantity;

  const validatePurchase = (): boolean => {
    const errs: Record<string, string> = {};

    if (!phoneNumber) {
      errs.phone = "Phone number is required";
    } else if (phoneNumber.length !== 11 || !phoneNumber.startsWith("0")) {
      errs.phone = "Enter a valid 11-digit phone number";
    }

    if (totalAmount > walletBalance) {
      setServerError("Insufficient wallet balance. Please top up.");
      return false;
    }

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
    if (!selectedProduct || !selectedVariation) return;
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
      const randomStr = Math.random().toString(36).substring(2, 10);
      const requestId = `${dateStr}${randomStr}`;

      const response = await vtpassEducationApi.purchase({
        serviceID: selectedProduct.id,
        variation_code: selectedVariation.variation_code,
        phone: phoneNumber,
        ...(selectedProduct.hasQuantity && quantity > 1 ? { quantity } : {}),
        ...(selectedProduct.hasVerify && profileId ? { billersCode: profileId } : {}),
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

  const handleTransactionResult = async (data: VtpassEducationPurchaseResponse) => {
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
    (data: { code: string; content?: { transactions: { status: string } } }) => {
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
    if (step === "verify") return "Verify Profile";
    if (step === "variations" && selectedProduct) return selectedProduct.shortName;
    return "Education";
  };

  const getHeaderSubtitle = (): string => {
    if (step === "purchase") return "Enter your details and confirm";
    if (step === "verify") return "Verify your JAMB Profile ID";
    if (step === "variations") return "Select a plan";
    return "Purchase WAEC & JAMB PINs";
  };

  const primaryAccount = dashboardData?.accounts?.[0];

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10"
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 sm:h-9 sm:w-9">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </span>
              {getHeaderTitle()}
            </h1>
            <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 sm:space-y-6 overflow-x-hidden">
        {/* Wallet card */}
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

        <section className="hidden sm:block max-w-4xl w-full min-w-0">
          <WalletAnalysisCards />
        </section>

        <AnimatePresence mode="wait">
          {/* Step 1: Product selection */}
          {step === "products" && (
            <motion.section
              key="products"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8">
                  <label className="label-auth mb-4 block text-dashboard-heading">
                    Select product
                  </label>
                  <div className="space-y-3">
                    {EDUCATION_PRODUCTS.map((product) => {
                      const logo = getNetworkLogo(product.id);
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="w-full flex items-center gap-3.5 p-4 rounded-xl border-2 border-dashboard-border/80 bg-dashboard-surface hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03] transition-all text-left touch-manipulation"
                        >
                          {logo ? (
                            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden ring-1 ring-dashboard-border/40 shrink-0 bg-dashboard-bg">
                              <Image
                                src={logo}
                                alt={product.shortName}
                                fill
                                className="object-contain p-1.5"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                              <GraduationCap className="h-5 w-5 text-purple-600" strokeWidth={1.75} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-[15px] text-dashboard-heading">
                              {product.name}
                            </p>
                            <p className="text-[11px] sm:text-xs text-dashboard-muted mt-0.5 truncate">
                              {product.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-dashboard-muted/40 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Step 2: Variation selection */}
          {step === "variations" && selectedProduct && (
            <motion.section
              key="variations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                {variationsError && (
                  <div className="mb-4">
                    <FormError message={variationsError} />
                  </div>
                )}

                <label className="label-auth mb-4 block text-dashboard-heading">
                  Select plan
                </label>

                {loadingVariations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-bg-primary" />
                  </div>
                ) : variationsData?.variations && variationsData.variations.length > 0 ? (
                  <div className="space-y-3">
                    {variationsData.variations.map((variation) => {
                      const price = parseFloat(variation.variation_amount);
                      const isSelected =
                        selectedVariation?.variation_code === variation.variation_code;
                      return (
                        <button
                          key={variation.variation_code}
                          onClick={() => handleSelectVariation(variation)}
                          className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all text-left touch-manipulation ${
                            isSelected
                              ? "border-brand-bg-primary bg-brand-bg-primary/[0.06]"
                              : "border-dashboard-border/80 bg-dashboard-surface hover:border-brand-bg-primary/40 hover:bg-brand-bg-primary/[0.03]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-brand-bg-primary shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-sm sm:text-[15px] text-dashboard-heading truncate">
                                {variation.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-dashboard-muted mt-0.5">
                                Fixed price
                              </p>
                            </div>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-brand-bg-primary tabular-nums shrink-0">
                            ₦{price.toLocaleString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-dashboard-muted">
                      No plans available for this product.
                    </p>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Step 3: JAMB Verification (JAMB only) */}
          {step === "verify" && selectedProduct?.hasVerify && selectedVariation && (
            <motion.section
              key="verify"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                {/* Selected plan recap */}
                <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 mb-5 sm:mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">
                        Plan
                      </p>
                      <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                        {selectedVariation.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">
                        Amount
                      </p>
                      <p className="text-base sm:text-lg font-bold text-brand-bg-primary tabular-nums">
                        ₦{parseFloat(selectedVariation.variation_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Profile ID input */}
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
                      JAMB Profile ID <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] sm:text-xs text-dashboard-muted">
                      Enter the Profile ID from the JAMB official website
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 0123456789"
                        value={profileId}
                        onChange={(e) => {
                          setProfileId(e.target.value.replace(/\s/g, ""));
                          setVerifyError("");
                        }}
                        disabled={isVerifying}
                        className={`w-full bg-transparent text-sm sm:text-base py-2.5 border-0 border-b-2 focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading font-mono ${
                          verifyError
                            ? "border-red-500"
                            : verifiedName
                              ? "border-green-500"
                              : "border-dashboard-border focus:border-brand-bg-primary"
                        }`}
                      />
                      {profileId && !isVerifying && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileId("");
                            setVerifiedName("");
                            setVerifyError("");
                          }}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dashboard-border/40 text-dashboard-muted hover:text-dashboard-heading transition-colors touch-manipulation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {verifyError && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{verifyError}</span>
                      </div>
                    )}
                  </div>

                  {/* Verified name badge */}
                  {verifiedName && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3.5 flex items-center gap-2.5">
                      <User className="h-4 w-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-green-600 font-medium">
                          Verified Student
                        </p>
                        <p className="text-sm font-semibold text-green-800">
                          {verifiedName}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleVerifyJamb}
                    disabled={isVerifying || !profileId.trim()}
                    className="w-full min-h-12 h-12 sm:min-h-[52px] sm:h-[52px] rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-base sm:text-lg font-semibold shadow-sm transition-all active:scale-[0.99] touch-manipulation"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Verifying…
                      </>
                    ) : verifiedName ? (
                      "Continue"
                    ) : (
                      "Verify Profile"
                    )}
                  </Button>
                </div>
              </div>
            </motion.section>
          )}

          {/* Step 4: Purchase */}
          {step === "purchase" && selectedProduct && selectedVariation && (
            <motion.section
              key="purchase"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full min-w-0"
            >
              <div className="rounded-2xl border border-dashboard-border/80 bg-dashboard-surface shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                {/* Selected plan recap */}
                <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4 mb-5 sm:mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">
                        Product
                      </p>
                      <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                        {selectedProduct.name}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">
                        Plan
                      </p>
                      <p className="font-semibold text-xs sm:text-sm text-dashboard-heading truncate">
                        {selectedVariation.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">
                        Price
                      </p>
                      <p className="text-base sm:text-lg font-bold text-brand-bg-primary tabular-nums">
                        ₦{unitPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* JAMB verified badge */}
                  {verifiedName && (
                    <div className="mt-3 pt-3 border-t border-dashboard-border/60 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <p className="text-[10px] sm:text-xs text-dashboard-muted">
                        Verified:{" "}
                        <strong className="text-dashboard-heading">
                          {verifiedName}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                  {/* Phone number */}
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
                          setFormErrors((p) => ({ ...p, phone: "" }));
                        }}
                        disabled={isSubmitting}
                        className={`w-full bg-transparent text-sm sm:text-base py-2.5 border-0 border-b-2 focus:outline-none focus:ring-0 transition-colors placeholder:text-dashboard-muted/50 text-dashboard-heading ${
                          phoneNumber && !isSubmitting ? "pr-8" : ""
                        } ${
                          formErrors.phone
                            ? "border-red-500"
                            : phoneNumber.length === 11
                              ? "border-green-500"
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
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{formErrors.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Quantity (WAEC only, 1-10) */}
                  {selectedProduct.hasQuantity && (
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-dashboard-heading">
                        Quantity
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1 || isSubmitting}
                          className="h-10 w-10 rounded-xl border-2 border-dashboard-border flex items-center justify-center text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-40 transition-all touch-manipulation"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-lg font-bold text-dashboard-heading tabular-nums w-8 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          disabled={quantity >= 10 || isSubmitting}
                          className="h-10 w-10 rounded-xl border-2 border-dashboard-border flex items-center justify-center text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-40 transition-all touch-manipulation"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {quantity > 1 && (
                        <p className="text-[10px] sm:text-xs text-dashboard-muted">
                          {quantity} × ₦{unitPrice.toLocaleString()} = ₦
                          {totalAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Total */}
                  <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">
                          Total
                        </p>
                        <p className="font-semibold text-xs sm:text-sm text-dashboard-heading">
                          {selectedVariation.name}
                          {quantity > 1 ? ` × ${quantity}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl sm:text-3xl font-bold text-dashboard-heading tabular-nums">
                          ₦{totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {serverError && <FormError message={serverError} />}

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !phoneNumber ||
                      phoneNumber.length !== 11
                    }
                    className="w-full min-h-12 h-12 sm:min-h-[52px] sm:h-[52px] rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-base sm:text-lg font-semibold shadow-sm transition-all active:scale-[0.99] touch-manipulation"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      `Purchase ${selectedProduct.shortName}`
                    )}
                  </Button>

                  <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/80 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-dashboard-muted">
                      <strong className="text-dashboard-heading">Note:</strong>{" "}
                      {selectedProduct.id === "waec"
                        ? "Your WAEC Result Checker Serial Number and PIN will be displayed after successful purchase. Save them securely."
                        : selectedProduct.id === "jamb"
                          ? "Your JAMB PIN will be displayed after successful purchase. Save it securely."
                          : "Your WAEC Registration PIN will be displayed after successful purchase. Save it securely."}
                    </p>
                  </div>
                </form>

                <PurchaseConfirmationModal
                  isOpen={showConfirmation}
                  onClose={() => setShowConfirmation(false)}
                  onConfirm={handleConfirmPurchase}
                  productName={selectedProduct.name}
                  variationName={selectedVariation.name}
                  phone={phoneNumber}
                  amount={unitPrice}
                  quantity={quantity}
                  profileId={selectedProduct.hasVerify ? profileId : undefined}
                  customerName={verifiedName || undefined}
                  walletBalance={walletBalance}
                  cashbackBalance={cashbackBalance}
                  cashbackPercent={cashbackPercent}
                  isLoading={isSubmitting}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
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
          serviceID={selectedProduct?.id}
          requestId={lastRequestId}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
