"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FlaskConical, Plus, RefreshCw, TestTube } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiVectorStore } from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatRelative,
} from "../../_components/Helpers";

interface Draft {
  name: string;
  driver: string;
  kind: string;
  index_name: string;
  dimensions: number;
  metric: string;
  credentials: string;
}

const EMPTY_DRAFT: Draft = {
  name: "",
  driver: "pgvector",
  kind: "pgvector",
  index_name: "smileai_kb",
  dimensions: 1536,
  metric: "cosine",
  credentials: "{}",
};

export default function VectorStoreSettingsPage() {
  const [items, setItems] = useState<SmileAiVectorStore[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const { run, invalidatePrefix } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await run(
          "smileai.vector-stores",
          () => smileAiApi.vectorStores.list(),
          { force },
        );
        setItems(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  const activate = async (id: string) => {
    try {
      await smileAiApi.vectorStores.activate(id);
      invalidatePrefix("smileai.vector-stores");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const archive = async (id: string) => {
    if (!confirm("Archive this vector store config?")) return;
    try {
      await smileAiApi.vectorStores.archive(id);
      invalidatePrefix("smileai.vector-stores");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await smileAiApi.vectorStores.test();
      setTestResult({
        success: !!res.success,
        message:
          res.message +
          (res.data?.latency_ms ? ` (${res.data.latency_ms}ms)` : ""),
      });
    } catch (err) {
      setTestResult({ success: false, message: (err as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const create = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await smileAiApi.vectorStores.create({
        name: draft.name.trim(),
        driver: draft.driver.trim(),
        kind: draft.kind.trim(),
        index_name: draft.index_name.trim(),
        dimensions: Number(draft.dimensions),
        metric: draft.metric,
        credentials: draft.credentials.trim()
          ? JSON.parse(draft.credentials)
          : undefined,
      });
      setDraft(null);
      invalidatePrefix("smileai.vector-stores");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Vector store"
        description="Where the knowledge base embeddings live"
        icon={<FlaskConical className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={() => setDraft(EMPTY_DRAFT)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              Add store
            </button>
            <button
              type="button"
              onClick={runTest}
              disabled={testing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <TestTube className="h-3.5 w-3.5" />
              Test
            </button>
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

        {testResult && (
          <Card
            className={`p-3 ${
              testResult.success
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <p
              className={`text-xs ${
                testResult.success ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              <strong>
                {testResult.success ? "Reachable" : "Test failed"}:
              </strong>{" "}
              {testResult.message}
            </p>
          </Card>
        )}

        <div className="space-y-2">
          {items === null
            ? Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <Skeleton height="1.5rem" />
                </Card>
              ))
            : items.length === 0
              ? (
                <Card className="p-6 text-center">
                  <p className="text-xs text-dashboard-muted">
                    No vector store configured. Add one — pgvector with
                    dimensions 1536 is a sensible default.
                  </p>
                </Card>
              )
              : items.map((s) => (
                  <Card key={s.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-dashboard-heading">
                            {s.name}
                          </span>
                          {s.is_active && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              <Check className="h-3 w-3" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-dashboard-muted mt-0.5">
                          {s.driver} · {s.dimensions} dim · {s.metric} ·{" "}
                          {s.index_name}
                        </p>
                        <p className="text-[11px] text-dashboard-muted mt-0.5">
                          Updated {formatRelative(s.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!s.is_active && (
                          <button
                            type="button"
                            onClick={() => activate(s.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            Make active
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => archive(s.id)}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-xl">
            <h2 className="text-base font-semibold text-dashboard-heading mb-3">
              Add vector store
            </h2>
            <div className="space-y-2.5">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Name (e.g. pgvector-prod)"
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft({ ...draft, kind: e.target.value, driver: e.target.value })
                  }
                  className="text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="pgvector">pgvector</option>
                  <option value="qdrant">qdrant</option>
                  <option value="pinecone">pinecone</option>
                  <option value="weaviate">weaviate</option>
                </select>
                <input
                  type="text"
                  value={draft.index_name}
                  onChange={(e) =>
                    setDraft({ ...draft, index_name: e.target.value })
                  }
                  placeholder="Index name"
                  className="text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={draft.dimensions}
                  onChange={(e) =>
                    setDraft({ ...draft, dimensions: Number(e.target.value) })
                  }
                  placeholder="Dimensions"
                  className="text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <select
                  value={draft.metric}
                  onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
                  className="text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="cosine">cosine</option>
                  <option value="dot">dot</option>
                  <option value="l2">l2</option>
                </select>
              </div>
              <textarea
                value={draft.credentials}
                onChange={(e) =>
                  setDraft({ ...draft, credentials: e.target.value })
                }
                rows={5}
                placeholder='Credentials (JSON, e.g. {"api_key": "…"})'
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-dashboard-border/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={create}
                disabled={saving || !draft.name || !draft.driver}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
