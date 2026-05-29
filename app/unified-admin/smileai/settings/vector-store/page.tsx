"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FlaskConical, Pencil, Plus, RefreshCw, TestTube } from "lucide-react";
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
  id?: string;
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

const EDIT_DRAFT = (s: SmileAiVectorStore): Draft => ({
  id: s.id,
  name: s.name,
  driver: s.driver,
  kind: s.kind,
  index_name: s.index_name,
  dimensions: s.dimensions,
  metric: s.metric,
  // Backend redacts encrypted values; show an empty object so editors don't
  // accidentally re-submit redacted placeholders. Empty = keep existing.
  credentials: "{}",
});

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

  const save = async () => {
    if (!draft) return;
    const credentialsRaw = sanitiseJsonInput(draft.credentials).trim();
    let credentials: Record<string, unknown> | undefined;
    // On edit, an empty credentials field means "keep existing"; on create
    // an empty object is still valid for drivers that need no credentials.
    const skipCredentials = draft.id && (credentialsRaw === "" || credentialsRaw === "{}");
    if (credentialsRaw && !skipCredentials) {
      try {
        const parsed = JSON.parse(credentialsRaw);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          setError(
            "Credentials must be a JSON object like {} or {\"api_key\": \"…\"}, not a string, array, or number.",
          );
          return;
        }
        credentials = parsed as Record<string, unknown>;
      } catch (err) {
        setError(
          `Credentials JSON is invalid: ${(err as Error).message}. Make sure you used straight quotes (") not curly ones (“ ”).`,
        );
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        driver: draft.driver.trim(),
        kind: draft.kind.trim(),
        index_name: draft.index_name.trim(),
        dimensions: Number(draft.dimensions),
        metric: draft.metric,
        credentials,
      };
      if (draft.id) {
        await smileAiApi.vectorStores.update(draft.id, payload);
      } else {
        await smileAiApi.vectorStores.create(payload);
      }
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
                          onClick={() => setDraft(EDIT_DRAFT(s))}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
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
              {draft.id ? "Edit" : "Add"} vector store
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
                  setDraft({
                    ...draft,
                    credentials: sanitiseJsonInput(e.target.value),
                  })
                }
                onPaste={(e) => {
                  e.preventDefault();
                  const text = sanitiseJsonInput(
                    e.clipboardData.getData("text"),
                  );
                  const target = e.currentTarget;
                  const start = target.selectionStart ?? draft.credentials.length;
                  const end = target.selectionEnd ?? draft.credentials.length;
                  const next =
                    draft.credentials.slice(0, start) +
                    text +
                    draft.credentials.slice(end);
                  setDraft({ ...draft, credentials: next });
                }}
                rows={5}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                autoComplete="off"
                placeholder={'Credentials (JSON, e.g. {"api_key": "..."})'}
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <JsonStatus value={draft.credentials} editMode={Boolean(draft.id)} />
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
                onClick={save}
                disabled={saving || !draft.name || !draft.driver}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : draft.id ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Replace common typographic characters that get auto-inserted by the OS
 * (curly quotes, en/em dashes used in place of hyphens, non-breaking spaces)
 * with their JSON-valid equivalents.
 */
function sanitiseJsonInput(value: string): string {
  return value
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/\u00A0/g, " ");
}

function JsonStatus({ value, editMode = false }: { value: string; editMode?: boolean }) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "{}") {
    if (editMode) {
      return (
        <p className="text-[10px] text-dashboard-muted mt-1">
          Leave as <code>{"{}"}</code> to keep the existing credentials. To
          rotate the key, paste a new JSON object like{" "}
          <code>{'{"api_key":"..."}'}</code>.
        </p>
      );
    }
    return (
      <p className="text-[10px] text-dashboard-muted mt-1">
        Leave as <code>{"{}"}</code> if this store needs no credentials (e.g.
        pgvector reuses <code>DATABASE_URL</code>), or paste a JSON object like{" "}
        <code>{'{"api_key":"..."}'}</code>.
      </p>
    );
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return (
        <p className="text-[10px] text-rose-600 mt-1">
          Must be a JSON object, not a {Array.isArray(parsed) ? "array" : typeof parsed}.
        </p>
      );
    }
    const keys = Object.keys(parsed);
    return (
      <p className="text-[10px] text-emerald-600 mt-1">
        ✓ Valid JSON ({keys.length} {keys.length === 1 ? "key" : "keys"}:{" "}
        {keys.join(", ")}). Sensitive values will be encrypted on save.
      </p>
    );
  } catch (err) {
    return (
      <p className="text-[10px] text-rose-600 mt-1">
        Invalid JSON: {(err as Error).message}
      </p>
    );
  }
}
