"use client";

import { Wallet, TrendingUp, ArrowUpRight, FileText } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 * i },
  }),
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: () => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  }),
};

export function WalletAnalysisCards() {
  const { dashboardData, isLoading: loading, error } = useDashboard();

  const parseBalance = (balance: string): number => {
    return parseFloat(balance.replace(/,/g, ""));
  };

  if (loading && !dashboardData) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-3 sm:p-4 animate-pulse"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-dashboard-border/60 rounded-lg mb-2 sm:mb-3" />
            <div className="h-2.5 sm:h-3 bg-dashboard-border/60 rounded w-14 sm:w-20 mb-1.5 sm:mb-2" />
            <div className="h-4 sm:h-6 bg-dashboard-border/60 rounded w-16 sm:w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p className="text-red-600 text-sm">{error || "Failed to load wallet data"}</p>
      </div>
    );
  }

  const walletBalance = parseBalance(dashboardData.wallet_card.current_balance);
  const totalFunding = parseBalance(dashboardData.wallet_card.all_time_fuunding);
  const totalWithdrawn = parseBalance(dashboardData.wallet_card.all_time_withdrawn);
  const transactionCount = dashboardData.transaction_history.length;

  const cards = [
    {
      label: "Wallet Balance",
      value: `₦${walletBalance.toLocaleString()}`,
      icon: Wallet,
      className: "hidden sm:block",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      label: "Total Withdrawn",
      value: `₦${totalWithdrawn.toLocaleString()}`,
      icon: ArrowUpRight,
      className: "",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Total Funding",
      value: `₦${totalFunding.toLocaleString()}`,
      icon: TrendingUp,
      className: "",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Total Transactions",
      value: String(transactionCount),
      icon: FileText,
      className: "",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={item}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className={`bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-3 sm:p-4 shadow-sm hover:shadow transition-shadow ${card.className}`}
        >
          <div className={`inline-flex p-1.5 sm:p-2 rounded-md sm:rounded-lg ${card.iconBg} mb-1 sm:mb-2`}>
            <card.icon className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${card.iconColor}`} strokeWidth={2} />
          </div>
          <p className="text-[10px] sm:text-xs text-dashboard-muted mb-0.5">{card.label}</p>
          <p className="text-xs sm:text-base font-semibold text-dashboard-heading tabular-nums">
            {card.value}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
