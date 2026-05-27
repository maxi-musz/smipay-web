"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Wrench } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type { SmileAiAction } from "@/types/admin/smileai";
import {
  Card,
  EmptyState,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  StatusPill,
  formatNumber,
} from "../_components/Helpers";

export default function ActionsListPage() {
  const [items, setItems] = useState<SmileAiAction[] | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await smileAiApi.actions.list(includeArchived);
      setItems(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleEnabled = async (action: SmileAiAction) => {
    try {
      if (action.enabled) {
        await smileAiApi.actions.disable(action.id);
      } else {
        await smileAiApi.actions.enable(action.id);
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Actions"
        description="Tools the assistant can call. Toggle enabled, try inputs, audit executions."
        icon={<Wrench className="h-5 w-5" />}
        actions={
          <>
            <Link
              href="/unified-admin/smileai/actions/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              New action
            </Link>
            <button
              type="button"
              onClick={load}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        <div className="flex items-center gap-2">
          <label className="text-xs text-dashboard-muted inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-dashboard-border/60"
            />
            Include archived
          </label>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-dashboard-bg border-b border-dashboard-border/60">
                <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Safety</th>
                  <th className="px-3 py-2 font-medium">Enabled</th>
                  <th className="px-3 py-2 font-medium text-right">✓ recent</th>
                  <th className="px-3 py-2 font-medium text-right">✗ recent</th>
                  <th className="px-3 py-2 font-medium text-right">p95</th>
                  <th className="px-3 py-2 font-medium">Binding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {isLoading && !items
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-3 py-2">
                          <Skeleton height="1.5rem" />
                        </td>
                      </tr>
                    ))
                  : items && items.length > 0
                    ? items.map((a) => (
                        <tr
                          key={a.id}
                          className="hover:bg-dashboard-bg transition-colors"
                        >
                          <td className="px-3 py-2">
                            <Link
                              href={`/unified-admin/smileai/actions/${a.id}`}
                              className="block"
                            >
                              <p className="text-xs font-medium text-dashboard-heading">
                                {a.display_name}
                              </p>
                              <p className="text-[11px] text-dashboard-muted font-mono">
                                {a.name}
                              </p>
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            <StatusPill status={a.safety} />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => toggleEnabled(a)}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                                a.enabled
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  a.enabled ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              {a.enabled ? "Enabled" : "Disabled"}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-emerald-700">
                            {formatNumber(a.recent?.success ?? 0)}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-rose-600">
                            {formatNumber(a.recent?.failed ?? 0)}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                            {a.recent?.p95_ms ? `${a.recent.p95_ms}ms` : "—"}
                          </td>
                          <td className="px-3 py-2 text-xs text-dashboard-muted truncate max-w-[200px]">
                            {a.binding_kind}
                          </td>
                        </tr>
                      ))
                    : null}
              </tbody>
            </table>
            {items && items.length === 0 && (
              <EmptyState
                title="No actions yet"
                description="Create your first action so the assistant can take real-world actions on behalf of users."
                cta={
                  <Link
                    href="/unified-admin/smileai/actions/new"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create first action
                  </Link>
                }
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
