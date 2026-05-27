"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, RefreshCw } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type { SmileAiHandoffRow } from "@/types/admin/smileai";
import {
  Card,
  EmptyState,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  StatusPill,
  formatNumber,
  formatRelative,
} from "../_components/Helpers";

const TRIGGERS = [
  "user_request",
  "sentiment",
  "tool_failure",
  "sensitive_intent",
  "low_confidence",
  "policy_block",
  "admin_force",
];

export default function HandoffsListPage() {
  const [trigger, setTrigger] = useState("");
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<SmileAiHandoffRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await smileAiApi.handoffs.list({
        trigger: trigger || undefined,
        limit,
        offset,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [trigger, limit, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Handoffs"
        description="Conversations the assistant escalated to a human"
        icon={<LifeBuoy className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        <Card className="p-3 flex items-center gap-2 flex-wrap">
          <select
            value={trigger}
            onChange={(e) => {
              setOffset(0);
              setTrigger(e.target.value);
            }}
            className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-dashboard-surface text-dashboard-heading"
          >
            <option value="">All triggers</option>
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <div className="ml-auto text-xs text-dashboard-muted">
            {formatNumber(total)} total
          </div>
        </Card>

        <div className="space-y-2">
          {isLoading && !items
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <Skeleton height="1.5rem" />
                </Card>
              ))
            : items && items.length > 0
              ? items.map((h) => (
                  <Link
                    key={h.id}
                    href={`/unified-admin/smileai/handoffs/${h.id}`}
                  >
                    <Card className="p-3 hover:border-orange-200 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[11px] font-medium text-dashboard-heading">
                              {h.trigger.replace(/_/g, " ")}
                            </span>
                            {h.conversation?.status && (
                              <StatusPill status={h.conversation.status} />
                            )}
                            {h.support_conversation && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                support: {h.support_conversation.status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-dashboard-heading line-clamp-2">
                            {h.summary_preview}
                          </p>
                          <p className="text-[11px] text-dashboard-muted mt-1">
                            {h.conversation?.user_email ?? h.conversation_id.slice(0, 8)} ·{" "}
                            {formatRelative(h.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              : null}
          {items && items.length === 0 && (
            <EmptyState
              title="No handoffs yet"
              description="When the assistant escalates a conversation, it'll appear here."
            />
          )}
        </div>

        {items && items.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-dashboard-muted">
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 disabled:opacity-50 hover:bg-dashboard-bg"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 disabled:opacity-50 hover:bg-dashboard-bg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
