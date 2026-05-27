"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, RefreshCw } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type { SmileAiConversationListItem } from "@/types/admin/smileai";
import {
  Card,
  EmptyState,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  StatusPill,
  formatNumber,
  formatRelative,
  formatUsd,
} from "../_components/Helpers";

const STATUSES = [
  "active",
  "awaiting_user",
  "handoff_pending",
  "handed_off",
  "resolved",
  "closed",
  "abandoned",
];

const TRIGGERS = [
  "user_request",
  "sentiment",
  "tool_failure",
  "sensitive_intent",
  "low_confidence",
  "policy_block",
  "admin_force",
];

export default function ConversationsPage() {
  const [status, setStatus] = useState<string>("");
  const [trigger, setTrigger] = useState<string>("");
  const [q, setQ] = useState("");
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<SmileAiConversationListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await smileAiApi.conversations.list({
        status: status || undefined,
        trigger: trigger || undefined,
        q: q.trim() || undefined,
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
  }, [status, trigger, q, limit, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Conversations"
        description="Every SmileAI conversation, filterable and live-updating"
        icon={<MessageSquare className="h-5 w-5" />}
        actions={
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
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => {
                setOffset(0);
                setStatus(e.target.value);
              }}
              className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-dashboard-surface text-dashboard-heading"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={trigger}
              onChange={(e) => {
                setOffset(0);
                setTrigger(e.target.value);
              }}
              className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-dashboard-surface text-dashboard-heading"
            >
              <option value="">All handoff triggers</option>
              {TRIGGERS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={q}
              placeholder="Search by id or email"
              onChange={(e) => {
                setOffset(0);
                setQ(e.target.value);
              }}
              className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-dashboard-surface text-dashboard-heading min-w-[200px]"
            />
            <div className="ml-auto text-xs text-dashboard-muted">
              {formatNumber(total)} total
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-dashboard-bg border-b border-dashboard-border/60">
                <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Persona</th>
                  <th className="px-3 py-2 font-medium">Handoff</th>
                  <th className="px-3 py-2 font-medium text-right">Msgs</th>
                  <th className="px-3 py-2 font-medium text-right">Cost</th>
                  <th className="px-3 py-2 font-medium text-right">Rating</th>
                  <th className="px-3 py-2 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {isLoading && !items ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-3 py-2">
                        <Skeleton height="1.5rem" />
                      </td>
                    </tr>
                  ))
                ) : items && items.length > 0 ? (
                  items.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-dashboard-bg cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/unified-admin/smileai/conversations/${c.id}`}
                          className="block"
                        >
                          <p className="font-medium text-dashboard-heading">
                            {c.user?.name ?? c.user_email ?? "Anonymous"}
                          </p>
                          <p className="text-[11px] text-dashboard-muted font-mono">
                            {c.id.slice(0, 8)}
                          </p>
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-3 py-2 text-xs text-dashboard-muted">
                        {c.persona ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-dashboard-muted">
                        {c.handoff_trigger ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                        {c.message_count}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                        {formatUsd(c.total_cost_usd)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                        {c.rating ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-dashboard-muted">
                        {formatRelative(c.last_message_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        title="No conversations match"
                        description="Try adjusting your filters or wait for users to start chatting."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {items && items.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-dashboard-border/40">
              <span className="text-xs text-dashboard-muted">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dashboard-bg"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dashboard-bg"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
