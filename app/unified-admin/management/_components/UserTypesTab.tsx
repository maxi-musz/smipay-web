"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Lock,
} from "lucide-react";
import { adminUserTypesApi } from "@/services/admin/user-types-api";
import type { UserType } from "@/types/admin/user-types";

interface Props {
  canManage: boolean;
}

export function UserTypesTab({ canManage }: Props) {
  const [types, setTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminUserTypesApi.list();
      setTypes(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setFormError(null);
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(key)) {
      setFormError("Key must be lowercase letters, numbers, - or _");
      return;
    }
    if (!label.trim()) {
      setFormError("Label is required");
      return;
    }
    setSaving(true);
    try {
      await adminUserTypesApi.create({
        key: key.trim(),
        label: label.trim(),
        description: description.trim() || undefined,
      });
      setKey("");
      setLabel("");
      setDescription("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (t: UserType) => {
    setEditKey(t.key);
    setEditLabel(t.label);
    setEditDesc(t.description ?? "");
  };

  const saveEdit = async (t: UserType) => {
    setSaving(true);
    try {
      await adminUserTypesApi.update(t.key, {
        label: editLabel.trim() || t.label,
        description: editDesc.trim() || null,
      });
      setEditKey(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: UserType) => {
    try {
      await adminUserTypesApi.update(t.key, { is_active: !t.is_active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const remove = async (t: UserType) => {
    if (!confirm(`Delete "${t.label}"? It will be removed from every user.`))
      return;
    try {
      await adminUserTypesApi.remove(t.key);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <div className="flex items-center justify-between border-b border-dashboard-border/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-dashboard-heading">User types</h2>
          <p className="text-xs text-dashboard-muted">
            Capability tags you can assign to admins (e.g. Data Analyst). Assign
            them on the Admin Users tab.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowAdd((s) => !s);
              setFormError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> New type
          </button>
        )}
      </div>

      {showAdd && canManage && (
        <div className="grid grid-cols-1 gap-3 border-b border-dashboard-border/60 bg-dashboard-bg/50 px-4 py-4 sm:grid-cols-3">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="key (e.g. auditor)"
            className="rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Auditor)"
            className="rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-sm"
          />
          {formError && (
            <p className="text-xs text-red-500 sm:col-span-3">{formError}</p>
          )}
          <div className="flex gap-2 sm:col-span-3">
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertCircle className="h-7 w-7 text-red-500" />
          <p className="text-sm text-dashboard-muted">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/60 text-left text-xs uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Key</th>
                <th className="px-4 py-2.5 font-semibold">Description</th>
                <th className="px-4 py-2.5 font-semibold">Active</th>
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => {
                const editing = editKey === t.key;
                return (
                  <tr
                    key={t.id}
                    className="border-b border-dashboard-border/40 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-dashboard-heading">
                      {editing ? (
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full rounded border border-dashboard-border/60 bg-dashboard-bg px-2 py-1 text-sm"
                        />
                      ) : (
                        <>
                          {t.label}
                          {t.is_system && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-dashboard-bg px-1.5 py-0.5 text-[10px] text-dashboard-muted">
                              <Lock className="h-2.5 w-2.5" /> system
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-dashboard-muted">{t.key}</td>
                    <td className="px-4 py-2.5 text-dashboard-muted">
                      {editing ? (
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full rounded border border-dashboard-border/60 bg-dashboard-bg px-2 py-1 text-sm"
                        />
                      ) : (
                        t.description ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        disabled={!canManage}
                        onClick={() => toggleActive(t)}
                        className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-60 ${
                          t.is_active ? "bg-brand-bg-primary" : "bg-gray-300"
                        }`}
                        title={t.is_active ? "Active" : "Inactive"}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                            t.is_active ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManage && editing ? (
                          <>
                            <button
                              onClick={() => saveEdit(t)}
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
                          </>
                        ) : canManage ? (
                          <>
                            <button
                              onClick={() => startEdit(t)}
                              className="rounded p-1.5 text-dashboard-muted hover:bg-dashboard-bg"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {!t.is_system && (
                              <button
                                onClick={() => remove(t)}
                                className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {types.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-dashboard-muted"
                  >
                    No user types yet.
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
