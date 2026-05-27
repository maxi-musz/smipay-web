"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Plus,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiPersona } from "@/types/admin/smileai";
import {
  Card,
  EmptyState,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatRelative,
} from "../_components/Helpers";

export default function PersonasListPage() {
  const [personas, setPersonas] = useState<SmileAiPersona[] | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newDraft, setNewDraft] = useState<{
    name: string;
    description: string;
    system_prompt: string;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const { run, invalidatePrefix } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await run(
          `smileai.personas.list:${includeArchived ? "all" : "active"}`,
          () => smileAiApi.personas.list(includeArchived),
          { force },
        );
        setPersonas(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [includeArchived, run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  const activate = async (id: string) => {
    try {
      await smileAiApi.personas.activate(id);
      invalidatePrefix("smileai.personas");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const createPersona = async () => {
    if (!newDraft) return;
    setCreating(true);
    try {
      await smileAiApi.personas.create({
        name: newDraft.name.trim(),
        description: newDraft.description.trim() || undefined,
        system_prompt: newDraft.system_prompt,
      });
      setNewDraft(null);
      invalidatePrefix("smileai.personas");
      await load(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Personas"
        description="System prompt + capabilities. Exactly one is active at a time."
        icon={<Wand2 className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={() =>
                setNewDraft({
                  name: "",
                  description: "",
                  system_prompt:
                    "You are SmileAI, the in-app assistant for SmiPay. Be concise.",
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              New persona
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

        <div className="flex items-center gap-2">
          <label className="text-xs text-dashboard-muted inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            Include archived
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isLoading && !personas
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton height="1rem" className="w-1/2 mb-2" />
                  <Skeleton height="4rem" />
                </Card>
              ))
            : personas && personas.length > 0
              ? personas.map((p) => (
                  <Card key={p.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/unified-admin/smileai/personas/${p.id}`}
                            className="text-sm font-semibold text-dashboard-heading hover:text-orange-600"
                          >
                            {p.name}
                          </Link>
                          {p.is_active && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              <Check className="h-3 w-3" /> Active
                            </span>
                          )}
                          <span className="text-[11px] text-dashboard-muted">
                            v{p.prompt_version}
                          </span>
                        </div>
                        {p.description && (
                          <p className="text-xs text-dashboard-muted">
                            {p.description}
                          </p>
                        )}
                      </div>
                      {!p.is_active && !p.archived_at && (
                        <button
                          type="button"
                          onClick={() => activate(p.id)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          Make active
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-dashboard-muted line-clamp-4 whitespace-pre-line">
                      {p.system_prompt}
                    </p>
                    <p className="text-[11px] text-dashboard-muted mt-2">
                      Updated {formatRelative(p.updatedAt)}
                    </p>
                  </Card>
                ))
              : null}
        </div>

        {personas && personas.length === 0 && (
          <EmptyState
            title="No personas yet"
            description="Create your first persona — the system prompt drives the assistant's voice and policy."
          />
        )}
      </div>

      {newDraft && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-2xl w-full shadow-xl">
            <h2 className="text-base font-semibold text-dashboard-heading mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-orange-500" />
              New persona
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newDraft.name}
                onChange={(e) =>
                  setNewDraft({ ...newDraft, name: e.target.value })
                }
                placeholder="Persona name (e.g. default, kyc_helper)"
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <input
                type="text"
                value={newDraft.description}
                onChange={(e) =>
                  setNewDraft({ ...newDraft, description: e.target.value })
                }
                placeholder="Description (optional)"
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <textarea
                value={newDraft.system_prompt}
                onChange={(e) =>
                  setNewDraft({ ...newDraft, system_prompt: e.target.value })
                }
                rows={10}
                placeholder="System prompt…"
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setNewDraft(null)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-dashboard-border/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createPersona}
                disabled={
                  creating || !newDraft.name.trim() || newDraft.system_prompt.length < 8
                }
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
