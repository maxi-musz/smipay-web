"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiFeedbackRow } from "@/types/admin/smileai";
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

const KINDS = ["thumbs_down", "thumbs_up", "rating", "flag"] as const;

export default function FeedbackPage() {
  const [kind, setKind] = useState<string>("");
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<SmileAiFeedbackRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { run } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          kind: kind || undefined,
          limit,
          offset,
        };
        const cacheKey = `smileai.feedback.list:${JSON.stringify(params)}`;
        const data = await run(
          cacheKey,
          () => smileAiApi.feedback.list(params),
          { force },
        );
        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [kind, limit, offset, run],
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
        title="Feedback"
        description="Thumbs, ratings, and flags from users"
        icon={<Star className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={refresh} />

        <Card className="p-3 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setOffset(0);
              setKind("");
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              kind === ""
                ? "bg-brand-bg-primary text-white"
                : "bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading"
            }`}
          >
            All
          </button>
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setOffset(0);
                setKind(k);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                kind === k
                  ? "bg-brand-bg-primary text-white"
                  : "bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading"
              }`}
            >
              {k.replace(/_/g, " ")}
            </button>
          ))}
          <div className="ml-auto text-xs text-dashboard-muted">
            {formatNumber(total)} total
          </div>
        </Card>

        <div className="space-y-2">
          {isLoading && !items
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <Skeleton height="2.5rem" />
                </Card>
              ))
            : items && items.length > 0
              ? items.map((f) => <FeedbackCard key={f.id} feedback={f} />)
              : null}
          {items && items.length === 0 && (
            <EmptyState
              title="No feedback yet"
              description="When users react to messages, the signals will appear here."
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

function FeedbackCard({ feedback: f }: { feedback: SmileAiFeedbackRow }) {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-8 w-8 rounded-full bg-dashboard-bg flex items-center justify-center text-dashboard-muted">
          {f.kind === "thumbs_up" ? (
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
          ) : f.kind === "thumbs_down" ? (
            <ThumbsDown className="h-4 w-4 text-rose-600" />
          ) : (
            <Star className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={f.kind} />
            {f.rating !== null && (
              <span className="text-xs text-dashboard-muted">
                {f.rating}/5 ⭐
              </span>
            )}
            <span className="text-xs text-dashboard-muted ml-auto">
              {formatRelative(f.createdAt)}
            </span>
          </div>
          {f.message && (
            <div className="bg-dashboard-bg rounded-lg p-2 text-xs text-dashboard-heading">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-dashboard-muted mb-0.5">
                AI response
              </p>
              <p className="line-clamp-4 whitespace-pre-wrap">{f.message.content}</p>
            </div>
          )}
          {f.reason && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-0.5">
                User said
              </p>
              <p className="whitespace-pre-wrap">{f.reason}</p>
            </div>
          )}
          <div className="flex items-center gap-3 text-[11px] text-dashboard-muted">
            <Link
              href={`/unified-admin/smileai/conversations/${f.conversation_id}`}
              className="text-orange-600 hover:underline"
            >
              Open conversation →
            </Link>
            {f.conversation?.user?.email && <span>{f.conversation.user.email}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
