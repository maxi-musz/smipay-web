"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Library,
  Loader2,
  RefreshCw,
  RotateCcw,
  Upload,
} from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
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

type PendingKind = "reindex" | "archive";

export default function KbListPage() {
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<SmileAiDocument[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rowPending, setRowPending] = useState<Record<string, PendingKind>>({});
  const [bulkPending, setBulkPending] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const { run, invalidatePrefix } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          status: (status || undefined) as SmileAiDocStatus | undefined,
          q: q.trim() || undefined,
          limit,
          offset,
        };
        const cacheKey = `smileai.kb.list:${JSON.stringify(params)}`;
        const data = await run(
          cacheKey,
          () => smileAiApi.kb.list(params),
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
    [status, q, limit, offset, run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  const setPendingFor = (id: string, kind: PendingKind | null) => {
    setRowPending((prev) => {
      const next = { ...prev };
      if (kind === null) {
        delete next[id];
      } else {
        next[id] = kind;
      }
      return next;
    });
  };

  const reindexRow = async (id: string) => {
    setPendingFor(id, "reindex");
    setError(null);
    try {
      await smileAiApi.kb.reindex(id);
      invalidatePrefix("smileai.kb");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingFor(id, null);
    }
  };

  const archiveRow = async (id: string, title: string) => {
    if (
      !confirm(
        `Archive "${title}"? It will no longer be searchable. You can restore it later from the database.`,
      )
    ) {
      return;
    }
    setPendingFor(id, "archive");
    setError(null);
    try {
      await smileAiApi.kb.archive(id);
      invalidatePrefix("smileai.kb");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingFor(id, null);
    }
  };

  const reindexAllFailed = async () => {
    setError(null);
    let failedDocs: SmileAiDocument[];
    try {
      const failedList = await smileAiApi.kb.list({
        status: "failed",
        limit: 100,
      });
      failedDocs = failedList.items;
    } catch (err) {
      setError((err as Error).message);
      return;
    }
    if (failedDocs.length === 0) return;
    if (
      !confirm(
        `Re-index ${failedDocs.length} failed document(s)? They will all run through the ingest pipeline again.`,
      )
    ) {
      return;
    }
    setBulkPending({ done: 0, total: failedDocs.length });
    for (let i = 0; i < failedDocs.length; i++) {
      try {
        await smileAiApi.kb.reindex(failedDocs[i].id);
      } catch (err) {
        console.error(`Re-index failed for ${failedDocs[i].id}:`, err);
      }
      setBulkPending({ done: i + 1, total: failedDocs.length });
    }
    invalidatePrefix("smileai.kb");
    setBulkPending(null);
    await load(true);
  };

  const failedCountOnPage = useMemo(
    () => (items ?? []).filter((d) => d.status === "failed").length,
    [items],
  );

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Knowledge Base"
        description="Documents the assistant searches before every answer"
        icon={<Library className="h-5 w-5" />}
        actions={
          <>
            {(status === "failed" || failedCountOnPage > 0) && (
              <button
                type="button"
                onClick={reindexAllFailed}
                disabled={bulkPending !== null || isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                title="Re-index every document currently in the failed status"
              >
                {bulkPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                {bulkPending
                  ? `Re-indexing ${bulkPending.done}/${bulkPending.total}…`
                  : "Re-index all failed"}
              </button>
            )}
            <Link
              href="/unified-admin/smileai/knowledge-base/upload"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Link>
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
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {isLoading && !items
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-3 py-2">
                          <Skeleton height="1.5rem" />
                        </td>
                      </tr>
                    ))
                  : items && items.length > 0
                    ? items.map((d) => {
                        const pending = rowPending[d.id];
                        const disabled = pending !== undefined || bulkPending !== null;
                        const isArchived = d.status === "archived";
                        return (
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
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  void reindexRow(d.id);
                                }}
                                disabled={disabled || isArchived}
                                title={
                                  isArchived
                                    ? "Restore the document before re-indexing"
                                    : "Re-index this document"
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                {pending === "reindex" ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                Re-index
                              </button>
                              {!isArchived && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    void archiveRow(d.id, d.title);
                                  }}
                                  disabled={disabled}
                                  title="Archive this document"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  {pending === "archive" ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Archive className="h-3 w-3" />
                                  )}
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
