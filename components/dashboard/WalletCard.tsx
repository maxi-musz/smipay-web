"use client";

import { useState } from "react";
import { Copy, Check, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedValue } from "./AnimatedValue";

interface WalletCardProps {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  balance: number;
  cashbackBalance?: string;
  isActive?: boolean;
  isLoading?: boolean;
  compact?: boolean;
  onFundWallet?: () => void;
  onViewHistory?: () => void;
}

export function WalletCard({
  bankName,
  accountNumber,
  accountHolderName,
  balance,
  cashbackBalance,
  isActive = true,
  isLoading = false,
  compact = false,
  onFundWallet,
  onViewHistory,
}: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const copyAccount = () => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          boxShadow:
            "0 8px 32px -8px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255,255,255,0.06) inset",
        }}
      >
        {/* Accent glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 90% -20%, rgba(234, 88, 12, 0.18) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 0% 110%, rgba(14, 165, 233, 0.10) 0%, transparent 40%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />

        <div className="relative px-4 py-3.5 flex items-center gap-4">
          {/* Balance section */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
              Balance
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-white tabular-nums tracking-tight">
                {balanceHidden ? "••••••" : (
                  <AnimatedValue value={`₦${balance.toLocaleString()}`} />
                )}
              </p>
              <button
                type="button"
                onClick={() => setBalanceHidden((v) => !v)}
                className="p-0.5 rounded text-slate-400 hover:text-slate-300 transition-colors"
              >
                {balanceHidden ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Account number + copy — hidden for now */}
          {/* {accountNumber && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <p className="text-[9px] text-slate-500 leading-tight">
                  {bankName || "Account"}
                </p>
                <p className="text-xs font-mono font-semibold text-slate-300 tracking-wider">
                  {accountNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={copyAccount}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )} */}

          {/* Fund button — disabled while funding is suspended */}
          <button
            type="button"
            disabled
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold bg-slate-600 text-slate-400 cursor-not-allowed opacity-50"
          >
            + Add Money
          </button>
        </div>
      </motion.div>
    );
  }

  // Full-size card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="relative overflow-hidden rounded-2xl shadow-xl"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)",
        boxShadow:
          "0 25px 50px -12px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      {/* Accent glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 130% 90% at 85% -10%, rgba(234, 88, 12, 0.2) 0%, transparent 50%), radial-gradient(ellipse 90% 70% at 5% 105%, rgba(14, 165, 233, 0.1) 0%, transparent 45%)",
        }}
      />
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />
      {/* Top highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

      <div className="relative p-4 sm:p-5">
        {/* Row 1: Bank name + status + fund */}
        {/* Bank name — hidden for now */}
        {/* <span className="text-xs font-medium text-slate-400">
          {isLoading ? (
            <span className="inline-block h-3 w-20 rounded bg-white/10 animate-pulse" />
          ) : (
            bankName || "Smipay"
          )}
        </span> */}
        {/* Active/Inactive badge — hidden for now */}
        {/* <span
          className={`px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm ${
            isActive
              ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-red-500/15 text-red-400 ring-1 ring-red-500/20"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span> */}

        {/* Balance */}
        <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
          Available balance
        </p>
        <div className="flex items-center gap-2.5">
          <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
            {balanceHidden
              ? "••••••"
              : <AnimatedValue value={`₦${balance.toLocaleString()}`} />}
          </p>
          <button
            type="button"
            onClick={() => setBalanceHidden((v) => !v)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
          >
            {balanceHidden ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {cashbackBalance && (
          <p className="mt-1 text-[11px] sm:text-xs text-emerald-400/90 font-medium tabular-nums">
            Cashback: {balanceHidden ? "••••" : cashbackBalance}
          </p>
        )}

        {/* Transaction History + Add Money row */}
        <div className="flex items-center justify-between mt-3">
          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Transaction History
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
          {/* Fund button — disabled while funding is suspended */}
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-600 text-slate-400 cursor-not-allowed opacity-50"
          >
            + Add Money
          </button>
        </div>

        {/* Bank name, account number, account name — hidden for now */}
        {/* {accountNumber ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-slate-500">Account number</span>
              <button
                type="button"
                onClick={copyAccount}
                className="p-1 -m-1 rounded-md hover:bg-white/[0.08] transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
            </div>
            <p className="text-sm sm:text-base font-mono font-semibold text-white tracking-wider mb-3">
              {accountNumber}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {accountHolderName}
            </p>
          </>
        ) : (
          <>
            <div className="h-5 w-40 rounded bg-white/10 animate-pulse mb-3" />
            <p className="text-[11px] text-amber-400/80 font-medium animate-pulse">
              Setting up your bank account...
            </p>
          </>
        )} */}
      </div>
    </motion.div>
  );
}
