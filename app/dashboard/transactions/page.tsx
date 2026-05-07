"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { getNetworkLogo } from "@/lib/network-logos";
import { useTransactionStore } from "@/store/transaction-store";

const PAGE_SIZE = 15;

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  deposit: "Deposits",
  transfer: "Transfers",
  airtime: "Airtime",
  data: "Data",
  cable: "Cable TV",
  education: "Education",
  betting: "Betting",
  referral_bonus: "Rewards",
};

const statusStyle = (s: string) =>
  s === "success"
    ? "text-emerald-600"
    : s === "pending"
      ? "text-amber-600"
      : "text-red-500";

export default function TransactionsPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [activeType, setActiveType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { fetchTransactions, getCached, isLoading: loading, error } = useTransactionStore();

  const cacheKey = `${page}|${activeType || "all"}|${searchQuery || ""}`;
  const cached = getCached(cacheKey);

  const transactions = cached?.transactions ?? [];
  const meta = cached?.pagination ?? null;
  const categories = cached?.categories ?? {};

  useEffect(() => {
    fetchTransactions({ page, limit: PAGE_SIZE, type: activeType, search: searchQuery });
  }, [page, activeType, searchQuery, fetchTransactions]);

  const showSkeleton = loading && !cached;

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearchQuery(value.trim());
    }, 400);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleTabChange = (type: string) => {
    setActiveType(type);
    setPage(1);
  };

  const categoryTabs = [
    { key: "all", label: "All", count: categories.all ?? 0 },
    ...Object.entries(categories)
      .filter(([k]) => k !== "all")
      .map(([key, count]) => ({
        key,
        label: CATEGORY_LABELS[key] || key,
        count,
      })),
  ];

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-dashboard-surface/80 backdrop-blur-md border-b border-dashboard-border/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium text-dashboard-muted hover:text-dashboard-heading transition-colors touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <h1 className="text-sm font-semibold text-dashboard-heading">
            Transactions
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-3">
        {/* Search — server-side with debounce */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by description, reference, phone…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 h-9 text-[13px] rounded-xl border border-dashboard-border/50 bg-dashboard-surface text-dashboard-heading placeholder:text-dashboard-muted/40 outline-none focus:border-brand-bg-primary/50 focus:ring-1 focus:ring-brand-bg-primary/20 transition-colors"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-dashboard-bg/60 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-dashboard-muted/60" />
            </button>
          )}
        </div>

        {/* Category filter tabs */}
        {categoryTabs.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5">
            {categoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors touch-manipulation ${
                  activeType === tab.key
                    ? "bg-brand-bg-primary text-white shadow-sm"
                    : "bg-dashboard-surface text-dashboard-muted ring-1 ring-dashboard-border/50 hover:ring-brand-bg-primary/30"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] tabular-nums ${
                    activeType === tab.key
                      ? "text-white/70"
                      : "text-dashboard-muted/60"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Summary + compact pagination — single row */}
        {meta && !showSkeleton && (
          <div className="flex items-center justify-between text-[11px] text-dashboard-muted px-0.5">
            <span>
              {meta.totalItems} transaction{meta.totalItems !== 1 && "s"}
              {activeType !== "all" && (
                <span className="text-dashboard-muted/50">
                  {" "}
                  in {CATEGORY_LABELS[activeType] || activeType}
                </span>
              )}
            </span>
            {meta.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-md text-dashboard-muted hover:text-dashboard-heading disabled:opacity-25 disabled:pointer-events-none transition-colors touch-manipulation"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="tabular-nums text-dashboard-muted">
                  {meta.currentPage}/{meta.totalPages}
                </span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  className="p-1 rounded-md text-dashboard-muted hover:text-dashboard-heading disabled:opacity-25 disabled:pointer-events-none transition-colors touch-manipulation"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {showSkeleton && (
          <div className="rounded-2xl border border-dashboard-border/50 bg-dashboard-surface overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 animate-pulse ${i > 0 ? "border-t border-dashboard-border/30" : ""}`}
              >
                <div className="h-8 w-8 rounded-lg bg-dashboard-border/40 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/5 rounded bg-dashboard-border/40" />
                  <div className="h-2.5 w-2/5 rounded bg-dashboard-border/30" />
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-3 w-14 rounded bg-dashboard-border/40 ml-auto" />
                  <div className="h-2.5 w-10 rounded bg-dashboard-border/30 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!showSkeleton && error && (
          <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-6 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={() => fetchTransactions({ page, limit: PAGE_SIZE, type: activeType, search: searchQuery })}
              className="text-sm font-medium text-brand-bg-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!showSkeleton && !error && transactions.length === 0 && (
          <div className="rounded-2xl border border-dashboard-border/50 bg-dashboard-surface p-10 text-center">
            <Receipt className="h-8 w-8 text-dashboard-muted/30 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-dashboard-heading mb-0.5">
              {searchQuery || activeType !== "all"
                ? "No matching transactions"
                : "No transactions yet"}
            </p>
            <p className="text-[12px] text-dashboard-muted">
              {searchQuery
                ? "Try a different search term"
                : activeType !== "all"
                  ? `No ${CATEGORY_LABELS[activeType]?.toLowerCase() || activeType} transactions found`
                  : "Your transaction history will appear here"}
            </p>
            {(searchQuery || activeType !== "all") && (
              <button
                onClick={() => {
                  clearSearch();
                  setActiveType("all");
                }}
                className="mt-3 text-[12px] font-medium text-brand-bg-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Transaction list */}
        {!showSkeleton && !error && transactions.length > 0 && (
          <div className="rounded-2xl border border-dashboard-border/50 bg-dashboard-surface overflow-hidden">
            {transactions.map((tx, idx) => {
              const isCredit = tx.credit_debit === "credit";
              const logo = isCredit
                ? null
                : (tx.provider ? getNetworkLogo(tx.provider) : null)
                  ?? tx.icon
                  ?? getNetworkLogo(tx.type);

              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/transactions/${tx.id}`)
                  }
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-dashboard-bg/40 active:bg-dashboard-bg/60 transition-colors touch-manipulation ${
                    idx > 0 ? "border-t border-dashboard-border/30" : ""
                  }`}
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg/80">
                    {isCredit ? (
                      <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />
                    ) : logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        className="h-full w-full object-contain p-[5px]"
                      />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 text-dashboard-muted" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-dashboard-heading truncate leading-tight">
                      {tx.description}
                    </p>
                    {tx.data_plan_name?.trim() ? (
                      <p className="text-[11px] text-brand-bg-primary/90 mt-0.5 leading-tight truncate">
                        {tx.data_plan_name}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-dashboard-muted mt-0.5 leading-tight">
                      {tx.date}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <p
                      className={`text-[13px] font-semibold tabular-nums leading-tight ${
                        isCredit ? "text-emerald-600" : "text-dashboard-heading"
                      }`}
                    >
                      {isCredit ? "+" : "−"}₦
                      {(tx.raw_amount ?? Number(String(tx.amount).replace(/,/g, ""))).toLocaleString()}
                    </p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${statusStyle(tx.status)}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
