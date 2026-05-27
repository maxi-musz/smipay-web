"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  CircleDollarSign,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Star,
} from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type {
  SmileAiConversationListItem,
  SmileAiCoverageGap,
  SmileAiOverview,
  SmileAiSparkline,
} from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  StatusPill,
  formatNumber,
  formatPercent,
  formatRelative,
  formatUsd,
} from "./_components/Helpers";
import Sparkline from "./_components/Sparkline";

type Range = "24h" | "7d" | "30d";

export default function SmileAiOverviewPage() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<SmileAiOverview | null>(null);
  const [sparklines, setSparklines] = useState<
    Record<string, SmileAiSparkline | null>
  >({});
  const [recentConvs, setRecentConvs] = useState<
    SmileAiConversationListItem[] | null
  >(null);
  const [gaps, setGaps] = useState<SmileAiCoverageGap[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sparklineRange: "7d" | "30d" = range === "30d" ? "30d" : "7d";
      const [
        overview,
        convSpark,
        handoffSpark,
        costSpark,
        recent,
        gapData,
      ] = await Promise.all([
        smileAiApi.analytics.overview(range),
        smileAiApi.analytics.sparkline("conversations", sparklineRange),
        smileAiApi.analytics.sparkline("handoffs", sparklineRange),
        smileAiApi.analytics.sparkline("cost_usd", sparklineRange),
        smileAiApi.conversations.list({ limit: 5 }),
        smileAiApi.analytics.coverageGaps(5),
      ]);
      setData(overview);
      setSparklines({
        conversations: convSpark,
        handoffs: handoffSpark,
        cost_usd: costSpark,
      });
      setRecentConvs(recent.items);
      setGaps(gapData.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const convValues = useMemo(
    () => sparklines.conversations?.points.map((p) => p.value) ?? [],
    [sparklines.conversations],
  );
  const handoffValues = useMemo(
    () => sparklines.handoffs?.points.map((p) => p.value) ?? [],
    [sparklines.handoffs],
  );
  const costValues = useMemo(
    () => sparklines.cost_usd?.points.map((p) => p.value) ?? [],
    [sparklines.cost_usd],
  );

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="SmileAI Overview"
        description="Health and KPIs for the in-app assistant"
        icon={<Bot className="h-5 w-5" />}
        actions={
          <>
            <RangeSelector value={range} onChange={setRange} />
            <button
              type="button"
              onClick={load}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Conversations"
            value={formatNumber(data?.conversations.total ?? 0)}
            sub={`${data?.conversations.active_now ?? 0} active now`}
            delta={data?.conversations.delta_pct ?? null}
            icon={<MessageSquare className="h-4 w-4" />}
            sparkline={convValues}
            isLoading={isLoading && !data}
          />
          <KpiCard
            label="Deflection rate"
            value={formatPercent(data?.deflection.rate)}
            sub={`${data?.deflection.resolved_by_ai ?? 0} by AI · ${
              data?.deflection.resolved_by_human ?? 0
            } by human`}
            icon={<Activity className="h-4 w-4" />}
            isLoading={isLoading && !data}
          />
          <KpiCard
            label="Handoffs"
            value={formatNumber(data?.handoff.count ?? 0)}
            sub={`${formatPercent(data?.handoff.rate)} of conversations`}
            delta={data?.handoff.delta_pct ?? null}
            invertDelta
            icon={<LifeBuoy className="h-4 w-4" />}
            sparkline={handoffValues}
            sparklineStroke="#ef4444"
            sparklineFill="rgba(239, 68, 68, 0.12)"
            isLoading={isLoading && !data}
          />
          <KpiCard
            label="Spend"
            value={formatUsd(data?.cost_usd ?? 0)}
            sub={`${formatNumber(
              (data?.tokens.in ?? 0) + (data?.tokens.out ?? 0),
            )} tokens`}
            icon={<CircleDollarSign className="h-4 w-4" />}
            sparkline={costValues}
            isLoading={isLoading && !data}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SmallCard
            label="CSAT (1–5)"
            value={
              data?.feedback.csat_avg !== null &&
              data?.feedback.csat_avg !== undefined
                ? data.feedback.csat_avg.toFixed(2)
                : "—"
            }
            sub={`${data?.feedback.csat_count ?? 0} ratings`}
            icon={<Star className="h-4 w-4" />}
          />
          <SmallCard
            label="Thumbs ratio"
            value={formatPercent(data?.feedback.ratio)}
            sub={`👍 ${data?.feedback.thumbs_up ?? 0} · 👎 ${
              data?.feedback.thumbs_down ?? 0
            }`}
            icon={<Star className="h-4 w-4" />}
          />
          <SmallCard
            label="Active LLM"
            value={data?.active_provider?.model ?? "Not set"}
            sub={data?.active_provider?.driver ?? ""}
            href="/unified-admin/smileai/settings/provider"
            icon={<Bot className="h-4 w-4" />}
          />
          <SmallCard
            label="Vector store"
            value={data?.active_vector_store?.driver ?? "Not set"}
            sub={
              data?.active_vector_store
                ? `${data.active_vector_store.dimensions} dim · ${data.active_vector_store.index_name}`
                : ""
            }
            href="/unified-admin/smileai/settings/vector-store"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-dashboard-heading">
                Recent conversations
              </h2>
              <Link
                href="/unified-admin/smileai/conversations"
                className="text-xs text-orange-600 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-1.5">
              {isLoading && !recentConvs ? (
                <>
                  <Skeleton height="2.5rem" />
                  <Skeleton height="2.5rem" />
                  <Skeleton height="2.5rem" />
                </>
              ) : recentConvs && recentConvs.length > 0 ? (
                recentConvs.map((c) => (
                  <Link
                    key={c.id}
                    href={`/unified-admin/smileai/conversations/${c.id}`}
                    className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-dashboard-bg transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-dashboard-heading truncate">
                        {c.user?.name ?? c.user_email ?? c.id.slice(0, 8)}
                      </p>
                      <p className="text-[11px] text-dashboard-muted truncate">
                        {c.message_count} msgs · {formatRelative(c.last_message_at)}
                      </p>
                    </div>
                    <StatusPill status={c.status} />
                  </Link>
                ))
              ) : (
                <p className="text-xs text-dashboard-muted py-3">
                  No conversations yet.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-dashboard-heading">
                Coverage gaps
              </h2>
              <Link
                href="/unified-admin/smileai/knowledge-base/coverage"
                className="text-xs text-orange-600 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {isLoading && !gaps ? (
                <>
                  <Skeleton height="2.5rem" />
                  <Skeleton height="2.5rem" />
                </>
              ) : gaps && gaps.length > 0 ? (
                gaps.map((g) => (
                  <div
                    key={g.query}
                    className="px-2.5 py-2 rounded-lg hover:bg-dashboard-bg transition-colors"
                  >
                    <p className="text-xs font-medium text-dashboard-heading line-clamp-2">
                      &quot;{g.query}&quot;
                    </p>
                    <p className="text-[11px] text-dashboard-muted">
                      {g.count} reports ·{" "}
                      {g.had_no_citations}/{g.count} had no citation ·{" "}
                      {formatRelative(g.last_seen)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-dashboard-muted py-3">
                  No coverage gaps detected.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RangeSelector({
  value,
  onChange,
}: {
  value: Range;
  onChange: (v: Range) => void;
}) {
  const ranges: Range[] = ["24h", "7d", "30d"];
  return (
    <div className="flex items-center gap-0.5 bg-dashboard-bg rounded-lg p-0.5 border border-dashboard-border/60">
      {ranges.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === r
              ? "bg-white text-dashboard-heading shadow-sm"
              : "text-dashboard-muted hover:text-dashboard-heading"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  delta,
  invertDelta,
  icon,
  sparkline,
  sparklineStroke = "#f97316",
  sparklineFill = "rgba(249, 115, 22, 0.12)",
  isLoading,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  invertDelta?: boolean;
  icon?: React.ReactNode;
  sparkline?: number[];
  sparklineStroke?: string;
  sparklineFill?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="p-4 space-y-2">
        <Skeleton height="0.75rem" className="w-1/3" />
        <Skeleton height="1.75rem" className="w-2/3" />
        <Skeleton height="0.75rem" className="w-1/2" />
      </Card>
    );
  }
  const positive =
    delta !== null && delta !== undefined
      ? invertDelta
        ? delta <= 0
        : delta >= 0
      : null;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-dashboard-muted">
          {icon}
          <p className="text-[11px] font-medium uppercase tracking-wider">
            {label}
          </p>
        </div>
        {sparkline && sparkline.length > 0 && (
          <Sparkline
            values={sparkline}
            width={80}
            height={24}
            stroke={sparklineStroke}
            fill={sparklineFill}
          />
        )}
      </div>
      <p className="text-xl font-bold text-dashboard-heading leading-tight">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {sub && <p className="text-[11px] text-dashboard-muted">{sub}</p>}
        {delta !== null && delta !== undefined && (
          <span
            className={`text-[11px] font-medium ${
              positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </Card>
  );
}

function SmallCard({
  label,
  value,
  sub,
  icon,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <Card className="p-4 h-full">
      <div className="flex items-center gap-1.5 text-dashboard-muted mb-1">
        {icon}
        <p className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-sm font-semibold text-dashboard-heading truncate">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-dashboard-muted truncate">{sub}</p>
      )}
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}
