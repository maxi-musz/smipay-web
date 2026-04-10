"use client";

import { useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminTransactionsStore } from "@/store/admin/admin-transactions-store";
import type { TransactionFilters } from "@/types/admin/transactions";
import { useAuth } from "@/hooks/useAuth";
import { isDevAdminEmail } from "@/lib/dev-admin";

const DEBOUNCE_MS = 400;

export function useAdminTransactions() {
  const searchParams = useSearchParams();
  const urlUserId = (searchParams.get("user_id") ?? "").trim();

  const {
    transactions,
    analytics,
    meta,
    filters,
    isLoading,
    error,
    fetchTransactions,
    setFilters,
    setPage,
    resetFilters,
  } = useAdminTransactionsStore();

  const { user: authUser, isLoading: authLoading } = useAuth();
  const mounted = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (filters.wallet_integrity && !isDevAdminEmail(authUser?.email)) {
      setFilters({ wallet_integrity: "" });
    }
  }, [authLoading, authUser?.email, filters.wallet_integrity, setFilters]);

  useLayoutEffect(() => {
    const current = useAdminTransactionsStore.getState().filters.user_id;
    if (current !== urlUserId) {
      setFilters({ user_id: urlUserId });
    }
  }, [urlUserId, setFilters]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fetchTransactions();
      return;
    }
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.search,
    filters.status,
    filters.transaction_type,
    filters.credit_debit,
    filters.payment_channel,
    filters.user_id,
    filters.min_amount,
    filters.max_amount,
    filters.date_from,
    filters.date_to,
    filters.sort_by,
    filters.sort_order,
    filters.wallet_integrity,
  ]);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      // Clear search immediately so we restore from store/baseline without delay
      if (!value.trim()) {
        setFilters({ search: "" });
        return;
      }
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        setFilters({ search: value });
      }, DEBOUNCE_MS);
    },
    [setFilters],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const updateFilters = useCallback(
    (patch: Partial<TransactionFilters>) => {
      setFilters(patch);
    },
    [setFilters],
  );

  const refetch = useCallback(() => fetchTransactions(true), [fetchTransactions]);

  return useMemo(
    () => ({
      transactions,
      analytics,
      meta,
      filters,
      isLoading,
      error,
      updateFilters,
      debouncedSearch,
      setPage,
      resetFilters,
      refetch,
    }),
    [transactions, analytics, meta, filters, isLoading, error, updateFilters, debouncedSearch, setPage, resetFilters, refetch],
  );
}
