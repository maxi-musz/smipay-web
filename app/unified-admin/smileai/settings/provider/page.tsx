"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check, Plus, RefreshCw, TestTube } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type { SmileAiProvider } from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatRelative,
} from "../../_components/Helpers";

type Tab = "llm" | "embeddings";

interface Draft {
  kind: "llm" | "embeddings";
  name: string;
  driver: string;
  model: string;
  base_url: string;
  credentials: string;
}

const EMPTY_DRAFT = (kind: "llm" | "embeddings"): Draft => ({
  kind,
  name: "",
  driver: "stub",
  model: "",
  base_url: "",
  credentials: "{}",
});

export default function ProviderSettingsPage() {
  const [tab, setTab] = useState<Tab>("llm");
  const [items, setItems] = useState<Record<Tab, SmileAiProvider[] | null>>({
    llm: null,
    embeddings: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testing, setTesting] = useState<"llm" | "embeddings" | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [llm, embed] = await Promise.all([
        smileAiApi.providers.list({ kind: "llm" }),
        smileAiApi.providers.list({ kind: "embeddings" }),
      ]);
      setItems({ llm, embeddings: embed });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = async (id: string) => {
    try {
      await smileAiApi.providers.activate(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const archive = async (id: string) => {
    if (!confirm("Archive this provider config?")) return;
    try {
      await smileAiApi.providers.archive(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const runTest = async (kind: "llm" | "embeddings") => {
    setTesting(kind);
    setTestResult(null);
    try {
      const res = await smileAiApi.providers.test(kind);
      setTestResult({
        success: !!res.success,
        message: res.success
          ? `${res.message}${res.data?.latency_ms ? ` (${res.data.latency_ms}ms)` : ""}`
          : res.message,
      });
    } catch (err) {
      setTestResult({ success: false, message: (err as Error).message });
    } finally {
      setTesting(null);
    }
  };

  const create = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await smileAiApi.providers.create({
        kind: draft.kind,
        name: draft.name.trim(),
        driver: draft.driver.trim(),
        model: draft.model.trim(),
        base_url: draft.base_url.trim() || undefined,
        credentials: draft.credentials.trim()
          ? JSON.parse(draft.credentials)
          : undefined,
      });
      setDraft(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const list = items[tab];

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Provider settings"
        description="Active LLM and embeddings providers used by the engine"
        icon={<Bot className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={() => setDraft(EMPTY_DRAFT(tab))}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              Add {tab}
            </button>
            <button
              type="button"
              onClick={() => runTest(tab)}
              disabled={testing === tab}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <TestTube className="h-3.5 w-3.5" />
              Test connection
            </button>
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
                {testResult.success ? "Connection ok" : "Test failed"}:
              </strong>{" "}
              {testResult.message}
            </p>
          </Card>
        )}

        <div className="flex items-center gap-1">
          <TabButton active={tab === "llm"} onClick={() => setTab("llm")}>
            LLM
          </TabButton>
          <TabButton
            active={tab === "embeddings"}
            onClick={() => setTab("embeddings")}
          >
            Embeddings
          </TabButton>
        </div>

        <div className="space-y-2">
          {list === null
            ? Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <Skeleton height="1.5rem" />
                </Card>
              ))
            : list.length === 0
              ? (
                <Card className="p-6 text-center">
                  <p className="text-xs text-dashboard-muted">
                    No {tab} provider configured. Add one to start chatting.
                  </p>
                </Card>
              )
              : list.map((p) => (
                  <Card key={p.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-dashboard-heading">
                            {p.name}
                          </span>
                          {p.is_active && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              <Check className="h-3 w-3" /> Active
                            </span>
                          )}
                          <span className="text-[11px] text-dashboard-muted">
                            {p.driver} · {p.model}
                          </span>
                        </div>
                        <p className="text-[11px] text-dashboard-muted mt-0.5 font-mono">
                          {p.base_url ?? "default endpoint"}
                        </p>
                        <p className="text-[11px] text-dashboard-muted mt-0.5">
                          Updated {formatRelative(p.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!p.is_active && (
                          <button
                            type="button"
                            onClick={() => activate(p.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            Make active
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => archive(p.id)}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
        </div>

        {tab === "embeddings" && list && list.length > 0 && (
          <Card className="p-3 border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-900">
              ⚠️ Changing the active embeddings provider may require re-indexing
              every document.
            </p>
          </Card>
        )}
      </div>

      {draft && (
        <DraftDialog
          draft={draft}
          setDraft={setDraft}
          onSubmit={create}
          saving={saving}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-brand-bg-primary text-white"
          : "text-dashboard-heading hover:bg-dashboard-bg"
      }`}
    >
      {children}
    </button>
  );
}

function DraftDialog({
  draft,
  setDraft,
  onSubmit,
  saving,
}: {
  draft: Draft;
  setDraft: (d: Draft | null) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-xl">
        <h2 className="text-base font-semibold text-dashboard-heading mb-3">
          Add {draft.kind} provider
        </h2>
        <div className="space-y-2.5">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Name (e.g. openai-prod)"
            className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={draft.driver}
              onChange={(e) => setDraft({ ...draft, driver: e.target.value })}
              placeholder="Driver (stub, openai, …)"
              className="text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <input
              type="text"
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              placeholder="Model (e.g. gpt-4o)"
              className="text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <input
            type="text"
            value={draft.base_url}
            onChange={(e) => setDraft({ ...draft, base_url: e.target.value })}
            placeholder="Base URL (optional)"
            className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <div>
            <label className="text-[11px] uppercase tracking-wider font-medium text-dashboard-muted">
              Credentials (JSON)
            </label>
            <textarea
              value={draft.credentials}
              onChange={(e) =>
                setDraft({ ...draft, credentials: e.target.value })
              }
              rows={6}
              className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
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
            onClick={onSubmit}
            disabled={saving || !draft.name || !draft.driver || !draft.model}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
