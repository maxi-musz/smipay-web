"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  PlayCircle,
  Save,
  Settings2,
  Shield,
  Wrench,
} from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type {
  SmileAiAction,
  SmileAiActionExecution,
} from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  StatusPill,
  formatRelative,
} from "../../_components/Helpers";

type Tab = "definition" | "schema" | "binding" | "permissions" | "executions" | "tryit";

interface ActionFormState {
  name: string;
  display_name: string;
  description: string;
  safety: "read" | "write" | "sensitive";
  parameters_schema: string;
  result_schema: string;
  binding_kind: string;
  binding: string;
  allowed_roles: string;
  rate_limit_per_minute: number;
  enabled: boolean;
}

const EMPTY_STATE: ActionFormState = {
  name: "",
  display_name: "",
  description: "",
  safety: "read",
  parameters_schema: JSON.stringify(
    { type: "object", properties: {}, required: [] },
    null,
    2,
  ),
  result_schema: "",
  binding_kind: "internal_service",
  binding: JSON.stringify({ service: "", method: "" }, null, 2),
  allowed_roles: "user",
  rate_limit_per_minute: 20,
  enabled: true,
};

export function ActionEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ActionFormState>(EMPTY_STATE);
  const [action, setAction] = useState<SmileAiAction | null>(null);
  const [tab, setTab] = useState<Tab>("definition");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [tryArgs, setTryArgs] = useState("{}");
  const [tryResult, setTryResult] = useState<unknown>(null);
  const [tryRunning, setTryRunning] = useState(false);
  const [executions, setExecutions] = useState<SmileAiActionExecution[] | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [a, exec] = await Promise.all([
          smileAiApi.actions.get(id),
          smileAiApi.actions.executions(id, { limit: 25 }),
        ]);
        if (cancelled) return;
        setAction(a);
        setExecutions(exec.items);
        setForm({
          name: a.name,
          display_name: a.display_name,
          description: a.description,
          safety: a.safety,
          parameters_schema: JSON.stringify(a.parameters_schema, null, 2),
          result_schema: a.result_schema
            ? JSON.stringify(a.result_schema, null, 2)
            : "",
          binding_kind: a.binding_kind,
          binding: JSON.stringify(a.binding ?? {}, null, 2),
          allowed_roles: Array.isArray(a.allowed_roles)
            ? a.allowed_roles.join(", ")
            : String(a.allowed_roles ?? ""),
          rate_limit_per_minute: a.rate_limit_per_minute,
          enabled: a.enabled,
        });
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        display_name: form.display_name.trim(),
        description: form.description.trim(),
        safety: form.safety,
        parameters_schema: JSON.parse(form.parameters_schema),
        result_schema: form.result_schema
          ? JSON.parse(form.result_schema)
          : undefined,
        binding: {
          kind: form.binding_kind,
          ...JSON.parse(form.binding || "{}"),
        },
        allowed_roles: form.allowed_roles
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        rate_limit_per_minute: form.rate_limit_per_minute,
        enabled: form.enabled,
      } as Partial<SmileAiAction>;
      if (id) {
        await smileAiApi.actions.update(id, payload);
      } else {
        const created = await smileAiApi.actions.create(payload);
        router.replace(`/unified-admin/smileai/actions/${created.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const runTry = async () => {
    if (!id) return;
    setTryRunning(true);
    try {
      const res = await smileAiApi.actions.tryIt(id, {
        args: JSON.parse(tryArgs || "{}"),
      });
      setTryResult(res);
    } catch (err) {
      setTryResult({ error: (err as Error).message });
    } finally {
      setTryRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title={id ? action?.display_name ?? "Action" : "New action"}
        description={id ? action?.name : "Configure schema, binding, and permissions"}
        icon={<Wrench className="h-5 w-5" />}
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
              onClick={save}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {id ? "Save" : "Create"}
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} />

        {isLoading ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="1.5rem" />
            <Skeleton height="6rem" />
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-0.5 px-2 py-2 border-b border-dashboard-border/60 overflow-x-auto">
                <TabButton active={tab === "definition"} onClick={() => setTab("definition")} icon={<ClipboardList className="h-3.5 w-3.5" />}>
                  Definition
                </TabButton>
                <TabButton active={tab === "schema"} onClick={() => setTab("schema")} icon={<ClipboardList className="h-3.5 w-3.5" />}>
                  Schema
                </TabButton>
                <TabButton active={tab === "binding"} onClick={() => setTab("binding")} icon={<Settings2 className="h-3.5 w-3.5" />}>
                  Binding
                </TabButton>
                <TabButton active={tab === "permissions"} onClick={() => setTab("permissions")} icon={<Shield className="h-3.5 w-3.5" />}>
                  Permissions
                </TabButton>
                {id && (
                  <>
                    <TabButton active={tab === "executions"} onClick={() => setTab("executions")} icon={<ClipboardList className="h-3.5 w-3.5" />}>
                      Executions
                    </TabButton>
                    <TabButton active={tab === "tryit"} onClick={() => setTab("tryit")} icon={<PlayCircle className="h-3.5 w-3.5" />}>
                      Try it
                    </TabButton>
                  </>
                )}
              </div>

              <div className="p-4 space-y-3">
                {tab === "definition" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Name (slug)">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="freeze_card"
                        className="input"
                      />
                    </Field>
                    <Field label="Display name">
                      <input
                        type="text"
                        value={form.display_name}
                        onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                        placeholder="Freeze card"
                        className="input"
                      />
                    </Field>
                    <Field label="Description" className="md:col-span-2">
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="input resize-none"
                      />
                    </Field>
                    <Field label="Safety class">
                      <select
                        value={form.safety}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            safety: e.target.value as ActionFormState["safety"],
                          })
                        }
                        className="input"
                      >
                        <option value="read">read</option>
                        <option value="write">write (confirmation required)</option>
                        <option value="sensitive">sensitive (confirmation required)</option>
                      </select>
                    </Field>
                    <Field label="Enabled">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.enabled}
                          onChange={(e) =>
                            setForm({ ...form, enabled: e.target.checked })
                          }
                        />
                        Visible to assistant
                      </label>
                    </Field>
                  </div>
                )}

                {tab === "schema" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Field label="Parameters (JSON Schema)">
                      <textarea
                        value={form.parameters_schema}
                        onChange={(e) =>
                          setForm({ ...form, parameters_schema: e.target.value })
                        }
                        rows={16}
                        className="input font-mono text-[11px]"
                      />
                    </Field>
                    <Field label="Result (JSON Schema, optional)">
                      <textarea
                        value={form.result_schema}
                        onChange={(e) =>
                          setForm({ ...form, result_schema: e.target.value })
                        }
                        rows={16}
                        className="input font-mono text-[11px]"
                      />
                    </Field>
                  </div>
                )}

                {tab === "binding" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Binding kind">
                      <select
                        value={form.binding_kind}
                        onChange={(e) =>
                          setForm({ ...form, binding_kind: e.target.value })
                        }
                        className="input"
                      >
                        <option value="internal_service">internal_service</option>
                        <option value="http">http</option>
                      </select>
                    </Field>
                    <div />
                    <Field label="Binding descriptor (JSON)" className="md:col-span-2">
                      <textarea
                        value={form.binding}
                        onChange={(e) => setForm({ ...form, binding: e.target.value })}
                        rows={10}
                        className="input font-mono text-[11px]"
                      />
                    </Field>
                  </div>
                )}

                {tab === "permissions" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Allowed roles (comma-separated)">
                      <input
                        type="text"
                        value={form.allowed_roles}
                        onChange={(e) =>
                          setForm({ ...form, allowed_roles: e.target.value })
                        }
                        placeholder="user, admin"
                        className="input"
                      />
                    </Field>
                    <Field label="Rate limit (per minute)">
                      <input
                        type="number"
                        min={1}
                        value={form.rate_limit_per_minute}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            rate_limit_per_minute: Number(e.target.value),
                          })
                        }
                        className="input"
                      />
                    </Field>
                  </div>
                )}

                {tab === "executions" && id && (
                  <ExecutionsTable items={executions} />
                )}

                {tab === "tryit" && id && (
                  <div className="space-y-3">
                    <Field label="Arguments (JSON)">
                      <textarea
                        value={tryArgs}
                        onChange={(e) => setTryArgs(e.target.value)}
                        rows={8}
                        className="input font-mono text-[11px]"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={runTry}
                      disabled={tryRunning}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {tryRunning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5" />
                      )}
                      Execute
                    </button>
                    {tryResult !== null && (
                      <pre className="bg-dashboard-bg p-3 rounded-lg text-[11px] overflow-x-auto max-h-96">
                        {JSON.stringify(tryResult, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid rgb(var(--dashboard-border, 226 232 240) / 0.6);
          border-radius: 0.5rem;
          padding: 0.5rem 0.625rem;
          font-size: 0.8125rem;
          background: white;
        }
        :global(.input:focus) {
          outline: none;
          box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.3);
          border-color: rgba(251, 146, 60, 0.5);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] uppercase tracking-wider font-medium text-dashboard-muted mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-brand-bg-primary text-white"
          : "text-dashboard-heading hover:bg-dashboard-bg"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ExecutionsTable({
  items,
}: {
  items: SmileAiActionExecution[] | null;
}) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-dashboard-muted">No executions yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-dashboard-bg">
          <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
            <th className="px-2 py-1.5">Status</th>
            <th className="px-2 py-1.5">Conversation</th>
            <th className="px-2 py-1.5 text-right">Latency</th>
            <th className="px-2 py-1.5">When</th>
            <th className="px-2 py-1.5">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashboard-border/40">
          {items.map((e) => (
            <tr key={e.id}>
              <td className="px-2 py-1.5">
                <StatusPill status={e.status} />
              </td>
              <td className="px-2 py-1.5 font-mono text-[11px]">
                {e.conversation_id?.slice(0, 8) ?? "—"}
              </td>
              <td className="px-2 py-1.5 text-right">
                {e.latency_ms ? `${e.latency_ms}ms` : "—"}
              </td>
              <td className="px-2 py-1.5 text-dashboard-muted">
                {formatRelative(e.createdAt)}
              </td>
              <td className="px-2 py-1.5 text-rose-600 truncate max-w-[200px]">
                {e.error ? JSON.stringify(e.error).slice(0, 120) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
