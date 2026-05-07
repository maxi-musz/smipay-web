"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SmartcardInput } from "./SmartcardInput";
import { FormError } from "@/components/auth/FormError";
import { Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { vtpassCableApi } from "@/services/vtpass/vtu/vtpass-cable-api";
import type { VtpassCableVerifyContent } from "@/types/vtpass/vtu/vtpass-cable";

interface SmartcardVerificationFormProps {
  serviceID: string;
  serviceName: string;
  onVerified: (verificationData: VtpassCableVerifyContent, smartcardNumber: string) => void;
  onError: (error: string) => void;
}

export function SmartcardVerificationForm({
  serviceID,
  serviceName,
  onVerified,
  onError,
}: SmartcardVerificationFormProps) {
  const [smartcardNumber, setSmartcardNumber] = useState("");
  const [errors, setErrors] = useState<{ smartcard?: string }>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [serverError, setServerError] = useState("");
  const [verificationData, setVerificationData] = useState<VtpassCableVerifyContent | null>(null);

  const isStartimes = serviceID.toLowerCase() === "startimes";
  const maxLength = isStartimes ? 11 : 10;
  const label = "Smartcard Number";
  const placeholder = isStartimes ? "02123456789" : "7012345678";

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!smartcardNumber) {
      newErrors.smartcard = `${label} is required`;
    } else if (smartcardNumber.length < (isStartimes ? 10 : 10) || smartcardNumber.length > maxLength) {
      newErrors.smartcard = `${label} must be ${isStartimes ? "10-11" : "10"} digits`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) return;

    setIsVerifying(true);
    try {
      const response = await vtpassCableApi.verifySmartcard({
        billersCode: smartcardNumber,
        serviceID,
      });

      if (response.success && response.data?.content) {
        setVerificationData(response.data.content);
        onVerified(response.data.content, smartcardNumber);
        return;
      }
      if (response.data?.code === "000" && response.data?.content) {
        setVerificationData(response.data.content);
        onVerified(response.data.content, smartcardNumber);
        return;
      }

      const errorMsg = response.message || "Verification failed. Please try again.";
      setServerError(errorMsg);
      onError(errorMsg);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again.";
      setServerError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDueDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  const parseAmount = (amountStr: string | undefined): string => {
    if (!amountStr) return "N/A";
    const cleaned = String(amountStr).replace(/[,\s]/g, "").trim();
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && isFinite(parsed)) return `₦${parsed.toLocaleString()}`;
    return `₦${amountStr}`;
  };

  if (verificationData) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200/80 bg-green-50/60 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-green-800 mb-3">Smartcard Verified</p>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-green-200/50">
                  <span className="text-green-700">Customer Name</span>
                  <span className="font-semibold text-green-900">{verificationData.Customer_Name || "N/A"}</span>
                </div>

                {verificationData.Status && (
                  <div className="flex justify-between items-center py-1.5 border-b border-green-200/50">
                    <span className="text-green-700">Status</span>
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded ${
                      verificationData.Status === "ACTIVE" ? "bg-green-200 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {verificationData.Status}
                    </span>
                  </div>
                )}

                {verificationData.Current_Bouquet && (
                  <div className="flex justify-between items-center py-1.5 border-b border-green-200/50">
                    <span className="text-green-700">Current Bouquet</span>
                    <span className="font-semibold text-green-900">{verificationData.Current_Bouquet}</span>
                  </div>
                )}

                {verificationData.Due_Date && (
                  <div className="flex justify-between items-center py-1.5 border-b border-green-200/50">
                    <span className="text-green-700">Due Date</span>
                    <span className="font-semibold text-green-900">{formatDueDate(verificationData.Due_Date)}</span>
                  </div>
                )}

                {verificationData.Renewal_Amount && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="font-semibold text-green-800">Renewal Amount</span>
                    <span className="font-bold text-base text-green-900">{parseAmount(verificationData.Renewal_Amount)}</span>
                  </div>
                )}

                {verificationData.Balance !== undefined && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-green-700">Balance</span>
                    <span className="font-semibold text-green-900">₦{Number(verificationData.Balance).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            setVerificationData(null);
            setSmartcardNumber("");
            setErrors({});
            setServerError("");
          }}
          variant="outline"
          className="w-full rounded-xl h-10 text-sm border-dashboard-border text-dashboard-heading hover:bg-dashboard-bg"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Verify Another Smartcard
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <SmartcardInput
        value={smartcardNumber}
        onChange={setSmartcardNumber}
        error={errors.smartcard}
        disabled={isVerifying}
        label={label}
        placeholder={placeholder}
        maxLength={maxLength}
      />

      {serverError && <FormError message={serverError} />}

      <Button
        type="submit"
        disabled={isVerifying || !smartcardNumber || smartcardNumber.length < 10}
        className="w-full min-h-12 h-12 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-sm sm:text-base font-semibold shadow-sm transition-all active:scale-[0.99] touch-manipulation"
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Verifying…
          </>
        ) : (
          `Verify ${serviceName.replace(" Subscription", "")} Smartcard`
        )}
      </Button>

      <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/80 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-dashboard-muted">
          <strong className="text-dashboard-heading">Note:</strong>{" "}
          Enter your {serviceName.replace(" Subscription", "")} smartcard number to verify your account and see renewal options.
        </p>
      </div>
    </form>
  );
}
