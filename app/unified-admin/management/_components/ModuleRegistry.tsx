"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Lock,
} from "lucide-react";
import { adminManagementApi } from "@/services/admin/management-api";
import type {
  AccessModule,
  CreateModulePayload,
} from "@/types/admin/management";

interface Props {
  canManage: boolean;
  onChanged: () => void;
}

const EMPTY_FORM: CreateModulePayload = {
  key: "",
  label: "",
  icon: "",
  href: "",
  parent_key: "",
  sort_order: 0,
};

export function ModuleRegistry({ canManage, onChanged }: Props) {
  const [modules, setModules] = useState<AccessModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CreateModulePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AccessModule>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminManagementApi.listModules();
      setModules(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parents = modules.filter((m) => !m.parent_key);

  const create = async () => {
    setFormError(null);
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(form.key)) {
      setFormError("Key must be lowercase letters, numbers, - or _");
      return;
    }
    if (!form.label.trim()) {
      setFormError("Label is required");
      return;
    }
    setSaving(true);
    try {
      await adminManagementApi.createModule({
        key: form.key.trim(),
        label: form.label.trim(),
        icon: form.icon?.trim() || undefined,
        href: form.href?.trim() || undefined,
        parent_key: form.parent_key?.trim() || undefined,
        sort_order: Number(form.sort_order) || 0,
      });
      setForm(EMPTY_FORM);
      setShowAdd(false);
      await load();
      onChanged();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (key: string) => {
    setSaving(true);
    try {
      await adminManagementApi.updateModule(key, {
        label: editForm.label,
        icon: editForm.icon ?? null,
        href: editForm.href ?? null,
        parent_key: editForm.parent_key ?? null,
        sort_order:
          editForm.sort_order != null ? Number(editForm.sort_order) : undefined,
      });
      setEditKey(null);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: AccessModule) => {
    try {
      await adminManagementApi.updateModule(m.key, { is_active: !m.is_active });
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const remove = async (m: AccessModule) => {
    if (!confirm(`Delete module "${m.label}"? This removes it from all levels.`))
      return;
    try {
      await adminManagementApi.deleteModule(m.key);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <div className="flex items-center justify-between border-b border-dashboard-border/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-dashboard-heading">
            Modules registry
          </h2>
          <p className="text-xs text-dashboard-muted">
            Registerable sidebar entries. New modules appear in the sidebar and
            the level matrix without a code change.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowAdd((s) => !s);
              setForm(EMPTY_FORM);
              setFormError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Register module
          </button>
        )}
      </div>

      {showAdd && canManage && (
        <div className="border-b border-dashboard-border/60 bg-dashboard-bg/50 px-4 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Key *">
              <input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="e.g. reports"
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
              />
            </Field>
            <Field label="Label *">
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Reports"
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
              />
            </Field>
            <Field label="Icon (Lucide name)">
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. BarChart3"
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
              />
            </Field>
            <Field label="Href">
              <input
                value={form.href}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="/unified-admin/reports"
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
              />
            </Field>
            <Field label="Parent">
              <select
                value={form.parent_key}
                onChange={(e) =>
                  setForm({ ...form, parent_key: e.target.value })
                }
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
              >
                <option value="">None (top level)</option>
                {parents.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
              />
            </Field>
          </div>
          {formError && (
            <p className="mt-2 text-xs text-red-500">{formError}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={create}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-dashboard-border/60 px-3 py-1.5 text-xs text-dashboard-heading hover:bg-dashboard-bg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertCircle className="h-7 w-7 text-red-500" />
          <p className="text-sm text-dashboard-muted">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/60 text-left text-xs uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-2.5 font-semibold">Label</th>
                <th className="px-4 py-2.5 font-semibold">Key</th>
                <th className="px-4 py-2.5 font-semibold">Parent</th>
                <th className="px-4 py-2.5 font-semibold">Order</th>
                <th className="px-4 py-2.5 font-semibold">Active</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => {
                const editing = editKey === m.key;
                return (
                  <tr
                    key={m.id}
                    className="border-b border-dashboard-border/40 last:border-0"
                  >
                    {editing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            defaultValue={m.label}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                label: e.target.value,
                              }))
                            }
                            className="w-full rounded border border-dashboard-border/60 bg-dashboard-bg px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-dashboard-muted">
                          {m.key}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            defaultValue={m.parent_key ?? ""}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                parent_key: e.target.value || null,
                              }))
                            }
                            className="rounded border border-dashboard-border/60 bg-dashboard-bg px-2 py-1 text-sm"
                          >
                            <option value="">None</option>
                            {parents
                              .filter((p) => p.key !== m.key)
                              .map((p) => (
                                <option key={p.key} value={p.key}>
                                  {p.label}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            defaultValue={m.sort_order}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                sort_order: Number(e.target.value),
                              }))
                            }
                            className="w-16 rounded border border-dashboard-border/60 bg-dashboard-bg px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">—</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => saveEdit(m.key)}
                              disabled={saving}
                              className="rounded p-1.5 text-green-600 hover:bg-green-50"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditKey(null)}
                              className="rounded p-1.5 text-dashboard-muted hover:bg-dashboard-bg"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 font-medium text-dashboard-heading">
                          <span className={m.parent_key ? "pl-4" : ""}>
                            {m.label}
                          </span>
                          {m.is_system && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-dashboard-bg px-1.5 py-0.5 text-[10px] text-dashboard-muted">
                              <Lock className="h-2.5 w-2.5" /> system
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-dashboard-muted">
                          {m.key}
                        </td>
                        <td className="px-4 py-2.5 text-dashboard-muted">
                          {m.parent_key ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-dashboard-muted">
                          {m.sort_order}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            disabled={!canManage}
                            onClick={() => toggleActive(m)}
                            className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-60 ${
                              m.is_active ? "bg-brand-bg-primary" : "bg-gray-300"
                            }`}
                            title={m.is_active ? "Active" : "Hidden"}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                m.is_active ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {canManage && (
                              <button
                                onClick={() => {
                                  setEditKey(m.key);
                                  setEditForm({});
                                }}
                                className="rounded p-1.5 text-dashboard-muted hover:bg-dashboard-bg"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canManage && !m.is_system && (
                              <button
                                onClick={() => remove(m)}
                                className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {modules.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-dashboard-muted"
                  >
                    No modules registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-dashboard-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
