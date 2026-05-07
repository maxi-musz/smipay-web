"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftRight, RefreshCw, BarChart3, Wallet } from "lucide-react";
import { useAdminTransactions } from "@/hooks/admin/useAdminTransactions";
import { adminUsersApi } from "@/services/admin/users-api";
import type { AdminUserWallet } from "@/types/admin/users";
import { TRANSACTION_STATUSES } from "@/types/admin/transactions";
import { TransactionsAnalytics } from "./_components/TransactionsAnalytics";
import { TransactionsFilters } from "./_components/TransactionsFilters";
import { TransactionsTable } from "./_components/TransactionsTable";
import { TransactionsPagination } from "./_components/TransactionsPagination";
import { TransactionsSkeleton } from "./_components/TransactionsSkeleton";

function formatNGN(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `₦${Number(value).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type FilteredUserInfo =
  | { status: "ready"; displayName: string; email: string | null; wallet: AdminUserWallet | null }
  | { status: "loading" }
  | { status: "error" };

function TransactionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [filteredUserInfo, setFilteredUserInfo] = useState<FilteredUserInfo | null>(null);
  const {
    transactions,
    meta,
    analytics,
    filters,
    isLoading,
    error,
    updateFilters,
    debouncedSearch,
    setPage,
    resetFilters,
    refetch,
  } = useAdminTransactions();

  const resetFiltersAndUrl = useCallback(() => {
    resetFilters();
    router.replace(pathname);
  }, [resetFilters, router, pathname]);

  const loadFilteredUserProfile = useCallback(async (userId: string): Promise<void> => {
    setFilteredUserInfo({ status: "loading" });
    try {
      const res = await adminUsersApi.getById(userId);
      if (!res.success || !res.data) {
        setFilteredUserInfo({ status: "error" });
        return;
      }
      const u = res.data;
      const displayName =
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        u.email ||
        (u.smipay_tag ? `@${u.smipay_tag}` : null) ||
        u.phone_number ||
        "User";
      setFilteredUserInfo({
        status: "ready",
        displayName,
        email: u.email,
        wallet: u.wallet ?? null,
      });
    } catch {
      setFilteredUserInfo({ status: "error" });
    }
  }, []);

  useEffect(() => {
    const userId = filters.user_id?.trim();
    if (!userId) {
      setFilteredUserInfo(null);
      return;
    }
    void loadFilteredUserProfile(userId);
  }, [filters.user_id, loadFilteredUserProfile]);

  const handleRefresh = useCallback(() => {
    refetch();
    const uid = filters.user_id?.trim();
    if (uid) void loadFilteredUserProfile(uid);
  }, [refetch, filters.user_id, loadFilteredUserProfile]);

  if (isLoading && !analytics) return <TransactionsSkeleton />;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">Transactions</h1>
              <p className="text-xs text-dashboard-muted">Monitor and manage all transactions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-3">
        {filters.user_id && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="rounded-xl border border-dashboard-border/70 bg-dashboard-surface shadow-sm border-l-4 border-l-brand-bg-primary overflow-hidden"
          >
            <div className="flex flex-wrap items-start gap-3 pl-4 pr-3 py-3.5">
              <div className="h-9 w-9 rounded-lg bg-brand-bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="h-4 w-4 text-brand-bg-primary" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted mb-1">
                  Filtered view
                </p>
                {(!filteredUserInfo || filteredUserInfo.status === "loading") && (
                  <p className="text-sm text-dashboard-heading">
                    <span className="inline-block h-4 w-64 max-w-full bg-dashboard-border/60 rounded animate-pulse align-middle" />
                  </p>
                )}
                {filteredUserInfo?.status === "error" && (
                  <p className="text-sm text-dashboard-heading">
                    Transaction analysis for user{" "}
                    <span className="font-mono text-xs">{filters.user_id}</span>
                    <span className="text-dashboard-muted"> — profile could not be loaded.</span>
                  </p>
                )}
                {filteredUserInfo?.status === "ready" && (
                  <p className="text-sm text-dashboard-heading leading-snug">
                    <span className="text-dashboard-muted">Transaction analysis for </span>
                    <span className="font-semibold text-dashboard-heading">{filteredUserInfo.displayName}</span>
                    {filteredUserInfo.email ? (
                      <span className="text-dashboard-muted"> ({filteredUserInfo.email})</span>
                    ) : null}
                  </p>
                )}
                <p className="text-xs text-dashboard-muted mt-1">
                  Totals and charts below apply only to this user&apos;s transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFiltersAndUrl}
                className="shrink-0 text-xs font-semibold text-brand-bg-primary hover:underline py-1"
              >
                Clear filter
              </button>
            </div>

            {filteredUserInfo?.status === "ready" && filteredUserInfo.wallet && (
              <div className="border-t border-dashboard-border/50 bg-dashboard-bg/40 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-3.5 w-3.5 text-dashboard-muted" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
                    Wallet (all-time)
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-dashboard-border/50 bg-dashboard-surface px-3 py-2">
                    <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wide">
                      Current balance
                    </p>
                    <p className="text-sm font-bold text-dashboard-heading tabular-nums">
                      {formatNGN(filteredUserInfo.wallet.current_balance)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashboard-border/50 bg-dashboard-surface px-3 py-2">
                    <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wide">
                      All-time funded
                    </p>
                    <p className="text-sm font-bold text-emerald-700 tabular-nums">
                      {formatNGN(filteredUserInfo.wallet.all_time_fuunding)}
                    </p>
                    <p className="text-[10px] text-dashboard-muted mt-0.5 leading-snug">
                      Deposits, rewards, and money received into this wallet
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashboard-border/50 bg-dashboard-surface px-3 py-2 sm:col-span-2 lg:col-span-2">
                    <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wide">
                      All-time outflows
                    </p>
                    <p className="text-sm font-bold text-dashboard-heading tabular-nums">
                      {formatNGN(filteredUserInfo.wallet.all_time_withdrawn)}
                    </p>
                    <p className="text-[10px] text-dashboard-muted mt-0.5 leading-snug">
                      Wallet spends (airtime/data/bills), Smipay transfers out, and bank payouts from wallet.
                      Not the same as “withdrawals” to a bank unless that flow debited the wallet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
          >
            {error}
            <button type="button" onClick={handleRefresh} className="ml-2 underline font-medium">
              Retry
            </button>
          </motion.div>
        )}

        {analytics && (
          <TransactionsAnalytics
            analytics={analytics}
            walletIntegrityFilter={filters.wallet_integrity}
            onWalletIntegrityFilterChange={(wallet_integrity) => updateFilters({ wallet_integrity })}
          />
        )}

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateFilters({ status: "" })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !filters.status
                ? "bg-brand-bg-primary text-white"
                : "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading"
            }`}
          >
            All{analytics ? ` (${analytics.overview.total_transactions.toLocaleString()})` : ""}
          </button>
          {TRANSACTION_STATUSES.map(({ value, label, color }) => {
            const count = analytics?.by_status[value]?.count ?? 0;
            const active = filters.status === value;
            const colorMap: Record<string, string> = {
              emerald: active ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200",
              amber: active ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 border border-amber-200",
              red: active ? "bg-red-500 text-white" : "bg-red-50 text-red-700 border border-red-200",
              slate: active ? "bg-slate-500 text-white" : "bg-slate-100 text-slate-600 border border-slate-200",
            };
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateFilters({ status: active ? "" : value })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${colorMap[color] ?? colorMap.slate}`}
              >
                {label} ({count.toLocaleString()})
              </button>
            );
          })}
        </div>

        <TransactionsFilters
          filters={filters}
          onSearch={debouncedSearch}
          onFilterChange={updateFilters}
          onReset={resetFiltersAndUrl}
          total={meta?.total ?? 0}
          isLoading={isLoading}
          filtersDisabled={isLoading}
        />

        {meta && (
          <TransactionsPagination meta={meta} onPageChange={setPage} disabled={isLoading} />
        )}

        <TransactionsTable
          transactions={transactions}
          isLoading={isLoading}
          hideUserColumn={Boolean(filters.user_id?.trim())}
        />
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsPageContent />
    </Suspense>
  );
}
