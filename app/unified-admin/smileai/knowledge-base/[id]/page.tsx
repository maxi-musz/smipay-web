"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  Library,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type {
  SmileAiChunk,
  SmileAiDocument,
  SmileAiKbRedaction,
  SmileAiRetrievedHit,
} from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  StatusPill,
  formatDateTime,
  formatNumber,
  formatRelative,
} from "../../_components/Helpers";

export default function KbDocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [doc, setDoc] = useState<(SmileAiDocument & { chunk_count: number }) | null>(null);
  const [chunks, setChunks] = useState<SmileAiChunk[]>([]);
  const [chunkTotal, setChunkTotal] = useState(0);
  const [chunkOffset, setChunkOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const [testQuery, setTestQuery] = useState("");
  const [testTopK, setTestTopK] = useState(5);
  const [testHits, setTestHits] = useState<SmileAiRetrievedHit[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const { run, invalidatePrefix } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const [d, c] = await Promise.all([
          run(
            `smileai.kb.get:${id}`,
            () => smileAiApi.kb.get(id),
            { force },
          ),
          run(
            `smileai.kb.chunks:${id}:${chunkOffset}`,
            () => smileAiApi.kb.chunks(id, { limit: 50, offset: chunkOffset }),
            { force },
          ),
        ]);
        setDoc(d);
        setChunks(c.items);
        setChunkTotal(c.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [id, chunkOffset, run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  const reindex = async () => {
    setPending("reindex");
    try {
      await smileAiApi.kb.reindex(id);
      invalidatePrefix("smileai.kb");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  const archive = async () => {
    if (!confirm("Archive this document? It will no longer be searchable.")) return;
    setPending("archive");
    try {
      await smileAiApi.kb.archive(id);
      invalidatePrefix("smileai.kb");
      router.push("/unified-admin/smileai/knowledge-base");
    } catch (err) {
      setError((err as Error).message);
      setPending(null);
    }
  };

  const runTestQuery = async () => {
    if (!testQuery.trim()) return;
    setTestLoading(true);
    try {
      const res = await smileAiApi.kb.testQuery({
        query: testQuery.trim(),
        top_k: testTopK,
      });
      setTestHits(res.hits);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTestLoading(false);
    }
  };

  const docMatches = testHits?.filter((h) => h.metadata?.document_id === id);
  const otherDocHits = testHits?.filter((h) => h.metadata?.document_id !== id);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title={doc?.title ?? "Document"}
        description={doc ? `${doc.source} · v${doc.version} · ${doc.chunk_count} chunks` : undefined}
        icon={<Library className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={reindex}
              disabled={pending === "reindex" || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              {pending === "reindex" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Re-index
            </button>
            {doc?.status !== "archived" && (
              <button
                type="button"
                onClick={archive}
                disabled={pending === "archive"}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </button>
            )}
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={refresh} />

        {isLoading && !doc ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
          </Card>
        ) : doc ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="space-y-4 min-w-0">
              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
                  Test query
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runTestQuery()}
                    placeholder="Ask anything…"
                    className="flex-1 text-sm border border-dashboard-border/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <select
                    value={testTopK}
                    onChange={(e) => setTestTopK(Number(e.target.value))}
                    className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                  </select>
                  <button
                    type="button"
                    onClick={runTestQuery}
                    disabled={testLoading || !testQuery.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {testLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    Search
                  </button>
                </div>
                {testHits && (
                  <div className="mt-3 space-y-2">
                    {docMatches && docMatches.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-700 mb-1">
                          {docMatches.length} hit{docMatches.length === 1 ? "" : "s"} from this document
                        </p>
                        {docMatches.map((h) => (
                          <HitCard key={h.id} hit={h} highlighted />
                        ))}
                      </div>
                    )}
                    {otherDocHits && otherDocHits.length > 0 && (
                      <div>
                        <p className="text-[11px] text-dashboard-muted mb-1">
                          {otherDocHits.length} from other documents
                        </p>
                        {otherDocHits.map((h) => (
                          <HitCard key={h.id} hit={h} />
                        ))}
                      </div>
                    )}
                    {testHits.length === 0 && (
                      <p className="text-xs text-dashboard-muted">No hits.</p>
                    )}
                  </div>
                )}
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-dashboard-border/60">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                    Chunks ({formatNumber(chunkTotal)})
                  </h3>
                </div>
                <div className="divide-y divide-dashboard-border/40 max-h-[60vh] overflow-y-auto">
                  {chunks.map((c) => (
                    <details key={c.id} className="px-3 py-2">
                      <summary className="cursor-pointer text-xs flex items-center justify-between gap-2">
                        <span className="font-medium text-dashboard-heading truncate">
                          #{c.ordinal} · {c.heading_path || "(no heading)"}
                        </span>
                        <span className="text-dashboard-muted shrink-0">
                          {c.token_count} tok
                        </span>
                      </summary>
                      <pre className="mt-2 text-[11px] whitespace-pre-wrap text-dashboard-heading bg-dashboard-bg p-2 rounded-lg max-h-60 overflow-y-auto">
                        {c.text}
                      </pre>
                    </details>
                  ))}
                  {chunks.length === 0 && (
                    <p className="text-xs text-dashboard-muted px-3 py-4">
                      No chunks yet.
                    </p>
                  )}
                </div>
                {chunkTotal > 50 && (
                  <div className="flex items-center justify-between px-3 py-2 border-t border-dashboard-border/40">
                    <span className="text-xs text-dashboard-muted">
                      {chunkOffset + 1}–{Math.min(chunkOffset + 50, chunkTotal)} of {chunkTotal}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setChunkOffset(Math.max(0, chunkOffset - 50))}
                        disabled={chunkOffset === 0}
                        className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 disabled:opacity-50 hover:bg-dashboard-bg"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setChunkOffset(chunkOffset + 50)}
                        disabled={chunkOffset + 50 >= chunkTotal}
                        className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 disabled:opacity-50 hover:bg-dashboard-bg"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <aside className="space-y-3 min-w-0">
              <Card className="p-3 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-1">
                  Status
                </h3>
                <StatusPill status={doc.status} />
                {doc.failure_reason && (
                  <p className="text-[11px] text-rose-600">{doc.failure_reason}</p>
                )}
              </Card>
              <Card className="p-3 space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-1">
                  Details
                </h3>
                <Row label="MIME" value={doc.mime_type} />
                <Row label="Version" value={`v${doc.version}`} />
                <Row label="Chunks" value={formatNumber(doc.chunk_count)} />
                <Row label="Uploaded" value={formatDateTime(doc.createdAt)} />
                <Row label="Updated" value={formatRelative(doc.updatedAt)} />
                {doc.uploaded_by && (
                  <Row label="By" value={doc.uploaded_by} />
                )}
              </Card>
              {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                <Card className="p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-dashboard-bg border border-dashboard-border/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
              <RedactionsCard
                redactions={
                  Array.isArray(doc.metadata?.redactions)
                    ? doc.metadata.redactions
                    : []
                }
              />
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RedactionsCard({
  redactions,
}: {
  redactions: SmileAiKbRedaction[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (redactions.length === 0) return null;
  const grouped = new Map<string, SmileAiKbRedaction[]>();
  for (const r of redactions) {
    const list = grouped.get(r.matched_term) ?? [];
    list.push(r);
    grouped.set(r.matched_term, list);
  }
  return (
    <Card className="p-3 space-y-2 border-amber-300/60">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Redactions ({redactions.length})
        </h3>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-semibold text-amber-700 hover:text-amber-800"
        >
          {expanded ? "Hide" : "View"}
        </button>
      </div>
      <p className="text-[11px] text-dashboard-muted leading-relaxed">
        These terms were stripped from the indexed content so the AI never
        sees them. Edit the source file and re-index if you want different
        behaviour.
      </p>
      <div className="flex flex-wrap gap-1">
        {[...grouped.entries()].map(([term, hits]) => (
          <span
            key={term}
            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono"
          >
            {term} × {hits.length}
          </span>
        ))}
      </div>
      {expanded && (
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {redactions.map((r, i) => (
            <li
              key={`${r.matched_term}-${i}`}
              className="text-[11px] bg-amber-50 border border-amber-200 rounded-lg p-2"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono font-semibold text-amber-800">
                  {r.matched_term}
                </span>
                <span className="text-amber-700 truncate text-[10px]">
                  {r.heading_path || "(no heading)"}
                </span>
              </div>
              <p className="text-amber-900 italic break-words">
                {r.snippet}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-dashboard-muted">{label}</span>
      <span className="text-dashboard-heading font-medium text-right break-words">
        {value}
      </span>
    </div>
  );
}

function HitCard({
  hit,
  highlighted,
}: {
  hit: SmileAiRetrievedHit;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`px-2.5 py-2 rounded-lg text-xs ${
        highlighted
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-dashboard-bg border border-dashboard-border/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <p className="font-medium text-dashboard-heading truncate">
          {hit.heading_path || "(no heading)"}
        </p>
        <span className="text-[11px] text-dashboard-muted shrink-0">
          score {(hit.score ?? 0).toFixed(3)}
        </span>
      </div>
      <p className="text-dashboard-muted line-clamp-3">{hit.text}</p>
    </div>
  );
}
