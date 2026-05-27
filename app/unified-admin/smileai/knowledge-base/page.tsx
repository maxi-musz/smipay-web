"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Library, RefreshCw, Upload } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type { SmileAiDocStatus, SmileAiDocument } from "@/types/admin/smileai";
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

const STATUSES: SmileAiDocStatus[] = [
  "uploaded",
  "parsing",
  "chunking",
  "embedding",
  "indexed",
  "failed",
  "archived",
];

export default function KbListPage() {
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<SmileAiDocument[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await smileAiApi.kb.list({
        status: (status || undefined) as SmileAiDocStatus | undefined,
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
  }, [status, q, limit, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Knowledge Base"
        description="Documents the assistant searches before every answer"
        icon={<Library className="h-5 w-5" />}
        actions={
          <>
            <Link
              href="/unified-admin/smileai/knowledge-base/upload"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
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
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={q}
              placeholder="Search title or hash"
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
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Tags</th>
                  <th className="px-3 py-2 font-medium text-right">Version</th>
                  <th className="px-3 py-2 font-medium text-right">Chunks</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {isLoading && !items
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-3 py-2">
                          <Skeleton height="1.5rem" />
                        </td>
                      </tr>
                    ))
                  : items && items.length > 0
                    ? items.map((d) => (
                        <tr
                          key={d.id}
                          className="hover:bg-dashboard-bg transition-colors"
                        >
                          <td className="px-3 py-2">
                            <Link
                              href={`/unified-admin/smileai/knowledge-base/${d.id}`}
                              className="block"
                            >
                              <p className="text-xs font-medium text-dashboard-heading">
                                {d.title}
                              </p>
                              <p className="text-[11px] text-dashboard-muted font-mono">
                                {d.source} · {d.id.slice(0, 8)}
                              </p>
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            <StatusPill status={d.status} />
                            {d.failure_reason && (
                              <p className="text-[10px] text-rose-600 mt-0.5">
                                {d.failure_reason}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(d.tags) && d.tags.length > 0 ? (
                                d.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-dashboard-bg border border-dashboard-border/40"
                                  >
                                    {t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-dashboard-muted">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                            v{d.version}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                            {formatNumber(d.chunk_count)}
                          </td>
                          <td className="px-3 py-2 text-xs text-dashboard-muted">
                            {formatRelative(d.updatedAt)}
                          </td>
                        </tr>
                      ))
                    : null}
              </tbody>
            </table>
            {items && items.length === 0 && (
              <EmptyState
                title="No documents yet"
                description="Upload your first knowledge base document so the assistant can cite something."
                cta={
                  <Link
                    href="/unified-admin/smileai/knowledge-base/upload"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload first document
                  </Link>
                }
              />
            )}
          </div>
          {items && items.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-dashboard-border/40">
              <span className="text-xs text-dashboard-muted">
                {offset + 1}–{Math.min(offset + limit, total)} of {total}
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
