"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Coins, RefreshCw, Settings, BarChart3, ScrollText, Lightbulb } from "lucide-react";
import { useAdminCashback } from "@/hooks/admin/useAdminCashback";
import { CashbackSkeleton } from "./_components/CashbackSkeleton";
import { CashbackSettings } from "./_components/CashbackSettings";
import { CashbackAnalytics } from "./_components/CashbackAnalytics";
import { CashbackHistory } from "./_components/CashbackHistory";
import { HowItWorksModal } from "./_components/HowItWorksModal";

type Tab = "settings" | "analytics" | "history";

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "History", icon: ScrollText },
];

export default function CashbackPage() {
  const {
    config,
    rules,
    configLoading,
    configError,
    analytics,
    analyticsLoading,
    analyticsError,
    history,
    historyMeta,
    historyFilters,
    historyLoading,
    historyError,
    updateHistoryFilters,
    setHistoryPage,
    resetHistoryFilters,
    refetchAll,
    refetchConfig,
  } = useAdminCashback();

  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const isInitialLoad = configLoading && !config;

  if (isInitialLoad) return <CashbackSkeleton />;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                Cashback Management
              </h1>
              <p className="text-xs text-dashboard-muted">
                Configure cashback rules, view analytics & history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHowItWorksOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">How it Works</span>
            </button>
            <button
              type="button"
              onClick={refetchAll}
              disabled={configLoading || analyticsLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${configLoading || analyticsLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === id
                  ? "bg-brand-bg-primary text-white shadow-sm"
                  : "text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Error states */}
        {configError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
          >
            {configError}
            <button
              type="button"
              onClick={refetchConfig}
              className="ml-2 underline font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {activeTab === "analytics" && analyticsError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
          >
            {analyticsError}
            <button
              type="button"
              onClick={refetchAll}
              className="ml-2 underline font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Tab content */}
        {activeTab === "settings" && config && (
          <CashbackSettings
            config={config}
            rules={rules}
            onSaved={refetchConfig}
          />
        )}

        {activeTab === "analytics" && (
          <>
            {analytics && config ? (
              <CashbackAnalytics analytics={analytics} config={config} />
            ) : analyticsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 border-2 border-brand-bg-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="text-center py-16 text-sm text-dashboard-muted">
                Unable to load analytics
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <CashbackHistory
            history={history}
            meta={historyMeta}
            filters={historyFilters}
            loading={historyLoading}
            error={historyError}
            onFilterChange={updateHistoryFilters}
            onPageChange={setHistoryPage}
            onReset={resetHistoryFilters}
          />
        )}
      </div>

      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </div>
  );
}
