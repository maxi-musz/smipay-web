"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiCoverageGap } from "@/types/admin/smileai";
import {
  Card,
  EmptyState,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatRelative,
} from "../../_components/Helpers";

export default function CoverageGapsPage() {
  const [limit, setLimit] = useState(20);
  const [items, setItems] = useState<SmileAiCoverageGap[] | null>(null);
  const [sampled, setSampled] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { run } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await run(
          `smileai.analytics.coverage-gaps:${limit}`,
          () => smileAiApi.analytics.coverageGaps(limit),
          { force },
        );
        setItems(data.items);
        setSampled(data.sampled);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Coverage Gaps"
        description="Top queries that returned a thumbs-down, low rating, or no citations"
        icon={<ShieldAlert className="h-5 w-5" />}
        actions={
          <>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-dashboard-surface text-dashboard-heading"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
            <button
              type="button"
              onClick={refresh}
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
        <ErrorBanner error={error} onRetry={refresh} />

        <Card className="p-3 text-xs text-dashboard-muted">
          Sampled {sampled} negative signals (thumbs-down, low ratings, flags).
          Click &quot;Add to KB&quot; to open a pre-filled upload flow.
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isLoading && !items
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <Skeleton height="1rem" className="w-2/3 mb-2" />
                  <Skeleton height="0.75rem" className="w-1/2" />
                </Card>
              ))
            : items && items.length > 0
              ? items.map((g) => (
                  <Card key={g.query} className="p-3">
                    <p className="text-sm font-medium text-dashboard-heading line-clamp-3 mb-1">
                      &quot;{g.query}&quot;
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-dashboard-muted mb-2">
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                        {g.count} reports
                      </span>
                      <span>{g.had_no_citations} had no citation</span>
                      <span>· {formatRelative(g.last_seen)}</span>
                    </div>
                    {g.sample_conversations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {g.sample_conversations.map((cid) => (
                          <Link
                            key={cid}
                            href={`/unified-admin/smileai/conversations/${cid}`}
                            className="text-[11px] px-1.5 py-0.5 rounded bg-dashboard-bg border border-dashboard-border/40 text-dashboard-muted hover:text-orange-600 font-mono"
                          >
                            {cid.slice(0, 8)}
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/unified-admin/smileai/knowledge-base/upload?seed=${encodeURIComponent(g.query)}`}
                      className="inline-flex items-center text-[11px] font-semibold text-orange-600 hover:underline"
                    >
                      Add to KB →
                    </Link>
                  </Card>
                ))
              : null}
        </div>

        {items && items.length === 0 && (
          <EmptyState
            title="No coverage gaps yet"
            description="When users thumbs-down or rate poorly, the queries will cluster here."
          />
        )}
      </div>
    </div>
  );
}
