"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Building2, Check, Copy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getBankLogo } from "@/lib/bank-logo";
import type { BankAccount } from "@/types/dashboard";

interface AddMoneyBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
}

/**
 * Bottom-sheet modal that mirrors the mobile `AccountDetailsModal`: it
 * shows the user's funding account(s) with the bank's logo and a one-tap
 * copy for the account number. No card-funding logic on purpose — this
 * is the simple "Add Money" affordance the dashboard's primary CTA opens.
 */
export function AddMoneyBottomSheet({
  isOpen,
  onClose,
  bankAccounts,
}: AddMoneyBottomSheetProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reset transient state every time the sheet opens.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIndex(0);
    setCopied(false);
  }, [isOpen, bankAccounts]);

  // Bound the selection if the accounts list shrinks while open.
  useEffect(() => {
    if (selectedIndex >= bankAccounts.length && bankAccounts.length > 0) {
      setSelectedIndex(0);
    }
  }, [bankAccounts.length, selectedIndex]);

  // Lock background scroll while the sheet is open. Mirrors native sheet UX.
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selected =
    bankAccounts.length > 0
      ? bankAccounts[Math.min(selectedIndex, bankAccounts.length - 1)]
      : null;
  const logoSrc = selected ? getBankLogo(selected.bank_name) : null;

  async function handleCopyAccountNumber() {
    if (!selected?.account_number) return;
    try {
      await navigator.clipboard.writeText(selected.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API can fail in older browsers / non-secure contexts; ignore.
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet — bottom-anchored on mobile, centered on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-0 sm:inset-0 sm:items-center sm:px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-money-sheet-title"
          className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-4"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 sm:hidden">
            <span className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2 sm:pt-5">
            <div>
              <h2
                id="add-money-sheet-title"
                className="text-xl font-bold text-gray-900"
              >
                Add Money
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Transfer to any of these accounts to fund your wallet instantly.
              </p>
            </div>
            <button
              onClick={onClose}
              className="-mr-2 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 pb-6 pt-3">
            {bankAccounts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                  <Building2 className="h-7 w-7 text-orange-500" />
                </div>
                <p className="text-base font-semibold text-gray-900">
                  No account assigned yet
                </p>
                <p className="px-4 text-sm leading-6 text-gray-500">
                  Please contact support to set up your funding account.
                </p>
                <Button
                  className="mt-2 w-full rounded-2xl bg-brand-bg-primary hover:bg-brand-bg-primary/90"
                  onClick={onClose}
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bankAccounts.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {bankAccounts.map((acct, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={acct.id}
                          type="button"
                          onClick={() => {
                            setSelectedIndex(idx);
                            setCopied(false);
                          }}
                          className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                            isSelected
                              ? "bg-brand-bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {acct.bank_name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selected && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      {logoSrc ? (
                        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
                          <Image
                            src={logoSrc}
                            alt={`${selected.bank_name} logo`}
                            fill
                            sizes="44px"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                          <Building2 className="h-6 w-6 text-orange-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-gray-900">
                          {selected.bank_name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                          {(selected.currency ?? "NGN").toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                        Account number
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="flex-1 select-all font-mono text-xl font-bold tracking-widest text-gray-900">
                          {selected.account_number}
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyAccountNumber}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            copied
                              ? "bg-green-100 text-green-700"
                              : "bg-brand-bg-primary/10 text-brand-bg-primary hover:bg-brand-bg-primary/20"
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {selected.account_holder_name && (
                      <div className="mt-3 flex items-start justify-between gap-3 border-t border-gray-100 pt-3">
                        <p className="text-[13px] text-gray-500">Account name</p>
                        <p className="flex-1 text-right text-[13px] font-medium leading-5 text-gray-900">
                          {selected.account_holder_name}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <p className="rounded-xl bg-orange-50 px-3 py-2.5 text-[12px] leading-5 text-orange-900">
                  This account is unique to you and only credits your Smipay
                  wallet. Transfers usually arrive within 1–2 minutes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
