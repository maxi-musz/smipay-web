"use client";

import { useState, useEffect } from "react";
import { TrendingUp, ArrowUpRight, Copy, Check } from "lucide-react";
import { userApi } from "@/services/user-api";
import type { WalletCard } from "@/types/dashboard";

export function WalletAnalysisCard() {
  const [walletData, setWalletData] = useState<WalletCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const response = await userApi.getAppHomepageDetails();
        if (response.success && response.data) {
          setWalletData(response.data.wallet_card);
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const parseBalance = (balance: string): number => {
    return parseFloat(balance.replace(/,/g, ""));
  };

  const copyBalance = () => {
    if (walletData) {
      navigator.clipboard.writeText(walletData.current_balance);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-brand-bg-primary to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
          <div className="h-8 bg-white/20 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return null;
  }

  const walletBalance = parseBalance(walletData.current_balance);
  const totalFunding = parseBalance(walletData.all_time_fuunding);
  const totalWithdrawn = parseBalance(walletData.all_time_withdrawn);

  return (
    <div className="bg-gradient-to-br from-brand-bg-primary to-indigo-700 rounded-xl shadow-lg p-6 text-white mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-blue-100 text-sm mb-1">Available Balance</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">
              ₦{walletBalance.toLocaleString()}
            </p>
            <button
              onClick={copyBalance}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Copy balance"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-300" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          walletData.isActive ? "bg-green-500" : "bg-red-500"
        }`}>
          {walletData.isActive ? "ACTIVE" : "INACTIVE"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-300" />
            <p className="text-blue-100 text-xs">Total Funding</p>
          </div>
          <p className="font-bold text-lg">
            ₦{totalFunding.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="h-4 w-4 text-red-300" />
            <p className="text-blue-100 text-xs">Total Withdrawn</p>
          </div>
          <p className="font-bold text-lg">
            ₦{totalWithdrawn.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
