"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  History,
  Loader2,
  RotateCcw,
  Save,
  Wand2,
} from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type {
  SmileAiPersona,
  SmileAiPersonaVersion,
} from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatRelative,
} from "../../_components/Helpers";

export default function PersonaEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [persona, setPersona] = useState<SmileAiPersona | null>(null);
  const [versions, setVersions] = useState<SmileAiPersonaVersion[] | null>(null);
  const [activeVersion, setActiveVersion] = useState<number>(0);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, v] = await Promise.all([
        smileAiApi.personas.get(id),
        smileAiApi.personas.listVersions(id),
      ]);
      setPersona(p);
      setSystemPrompt(p.system_prompt);
      setDescription(p.description ?? "");
      setCapabilities(JSON.stringify(p.capabilities ?? {}, null, 2));
      setVersions(v.items);
      setActiveVersion(v.active_version);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setPending("save");
    try {
      const caps = capabilities.trim()
        ? JSON.parse(capabilities)
        : undefined;
      await smileAiApi.personas.update(id, {
        description: description.trim() || undefined,
        system_prompt: systemPrompt,
        capabilities: caps,
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  const activate = async () => {
    setPending("activate");
    try {
      await smileAiApi.personas.activate(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  const archive = async () => {
    if (!confirm("Archive this persona?")) return;
    setPending("archive");
    try {
      await smileAiApi.personas.archive(id);
      router.push("/unified-admin/smileai/personas");
    } catch (err) {
      setError((err as Error).message);
      setPending(null);
    }
  };

  const rollback = async (version: number) => {
    if (!confirm(`Roll back to version ${version}? This creates a new version with the same content.`))
      return;
    setPending(`rollback-${version}`);
    try {
      await smileAiApi.personas.rollback(id, version);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  const dirty =
    persona !== null &&
    (systemPrompt !== persona.system_prompt ||
      description !== (persona.description ?? "") ||
      capabilities !== JSON.stringify(persona.capabilities ?? {}, null, 2));

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title={persona?.name ?? "Persona"}
        description={
          persona
            ? `v${persona.prompt_version}${persona.is_active ? " · active" : ""}`
            : undefined
        }
        icon={<Wand2 className="h-5 w-5" />}
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
            {persona && !persona.is_active && !persona.archived_at && (
              <button
                type="button"
                onClick={activate}
                disabled={pending === "activate"}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
              >
                {pending === "activate" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Make active
              </button>
            )}
            {persona && !persona.archived_at && (
              <button
                type="button"
                onClick={archive}
                disabled={pending === "archive"}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={pending === "save" || !dirty}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {pending === "save" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {dirty ? "Save (new version)" : "Saved"}
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        {isLoading && !persona ? (
          <Card className="p-4 space-y-3">
            <Skeleton height="1rem" />
            <Skeleton height="10rem" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className="space-y-3 min-w-0">
              <Card className="p-4 space-y-3">
                <Field label="Description">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </Field>
                <Field label="System prompt (markdown)">
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={20}
                    className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </Field>
                <Field label="Capabilities (JSON)">
                  <textarea
                    value={capabilities}
                    onChange={(e) => setCapabilities(e.target.value)}
                    rows={8}
                    className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </Field>
              </Card>
            </div>

            <aside className="space-y-3 min-w-0">
              <Card className="p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Version history
                </h3>
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                  {versions === null && (
                    <Skeleton height="2rem" />
                  )}
                  {versions && versions.length === 0 && (
                    <p className="text-[11px] text-dashboard-muted">
                      No snapshots yet — the first will appear after the next edit.
                    </p>
                  )}
                  {versions?.map((v) => (
                    <div
                      key={v.id}
                      className={`px-2.5 py-2 rounded-lg ${
                        v.prompt_version === activeVersion
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-dashboard-bg border border-dashboard-border/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-dashboard-heading flex items-center gap-1">
                            v{v.prompt_version}
                            {v.prompt_version === activeVersion && (
                              <span className="text-[10px] uppercase font-bold text-emerald-700">
                                Active
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-dashboard-muted">
                            {formatRelative(v.createdAt)}
                          </p>
                          {v.note && (
                            <p className="text-[11px] text-dashboard-muted truncate">
                              {v.note}
                            </p>
                          )}
                        </div>
                        {v.prompt_version !== activeVersion && (
                          <button
                            type="button"
                            onClick={() => rollback(v.prompt_version)}
                            disabled={pending === `rollback-${v.prompt_version}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-1 rounded-lg border border-dashboard-border/60 hover:bg-dashboard-surface disabled:opacity-50"
                          >
                            {pending === `rollback-${v.prompt_version}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Roll back
                          </button>
                        )}
                      </div>
                      <details className="mt-1.5">
                        <summary className="text-[11px] text-dashboard-muted cursor-pointer">
                          Preview
                        </summary>
                        <pre className="mt-1 text-[10px] whitespace-pre-wrap text-dashboard-heading max-h-40 overflow-y-auto bg-white p-2 rounded">
                          {v.system_prompt.slice(0, 800)}
                          {v.system_prompt.length > 800 && "…"}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-medium text-dashboard-muted mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
