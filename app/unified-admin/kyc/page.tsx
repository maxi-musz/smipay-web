"use client";

import { motion } from "motion/react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useAdminKyc } from "@/hooks/admin/useAdminKyc";
import { KycSkeleton } from "./_components/KycSkeleton";
import { TierPropertiesPanel } from "./_components/TierPropertiesPanel";
import { TierListPanel } from "./_components/TierListPanel";

export default function KycAdminPage() {
  const { tiers, properties, loading, error, refetch } = useAdminKyc();
  const isInitialLoad = loading && tiers.length === 0 && properties.length === 0;

  if (isInitialLoad) return <KycSkeleton />;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                KYC & Account Tiers
              </h1>
              <p className="text-xs text-dashboard-muted">
                Configure dynamic tier properties, limits, and verification requirements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={refetch}
              className="ml-2 underline font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        <TierPropertiesPanel properties={properties} onChanged={refetch} />
        <TierListPanel tiers={tiers} properties={properties} onChanged={refetch} />
      </div>
    </div>
  );
}
