"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Percent, RefreshCw, Lightbulb } from "lucide-react";
import { useAdminMarkup } from "@/hooks/admin/useAdminMarkup";
import { MarkupSkeleton } from "./_components/MarkupSkeleton";
import { MarkupSettings } from "./_components/MarkupSettings";
import { HowItWorksModal } from "./_components/HowItWorksModal";

export default function MarkupPage() {
  const {
    config,
    rules,
    configLoading,
    configError,
    refetchAll,
    refetchConfig,
  } = useAdminMarkup();

  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const isInitialLoad = configLoading && !config;

  if (isInitialLoad) return <MarkupSkeleton />;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <Percent className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                Service Markup Settings
              </h1>
              <p className="text-xs text-dashboard-muted">
                Configure markup margins per service; revenue appears in Dashboard
                &amp; Transactions
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
              disabled={configLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${configLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
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

        {config && (
          <>
            <p className="text-xs text-dashboard-muted">
              Markup is our revenue margin on provider prices, not a user
              reward. When ON, users pay provider price + markup; we keep the
              markup. Revenue appears in Dashboard and Transactions.
            </p>
            <MarkupSettings
              config={config}
              rules={rules}
              onSaved={refetchConfig}
            />
          </>
        )}

        {!config && !configLoading && !configError && (
          <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-8 text-center">
            <p className="text-sm text-dashboard-muted">
              No markup config yet. The backend may need to be initialized, or
              try refreshing.
            </p>
            <button
              type="button"
              onClick={refetchConfig}
              className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90"
            >
              Load config
            </button>
          </div>
        )}
      </div>

      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </div>
  );
}
