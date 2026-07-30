"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Check, X, Tags } from "lucide-react";
import { adminManagementApi } from "@/services/admin/management-api";
import { adminUserTypesApi } from "@/services/admin/user-types-api";
import type { AccessLevel, AdminUser } from "@/types/admin/management";
import type { UserType } from "@/types/admin/user-types";

interface Props {
  canManage: boolean;
}

export function AdminUsersTab({ canManage }: Props) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [levels, setLevels] = useState<AccessLevel[]>([]);
  const [types, setTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  // User-type editor state.
  const [typeEditId, setTypeEditId] = useState<string | null>(null);
  const [typeDraft, setTypeDraft] = useState<Set<string>>(new Set());
  const [savingTypesId, setSavingTypesId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminsRes, levelsRes, typesRes] = await Promise.all([
        adminManagementApi.listAdmins(),
        adminManagementApi.listLevels(),
        adminUserTypesApi.list(),
      ]);
      setAdmins(adminsRes.data ?? []);
      setLevels(levelsRes.data?.levels ?? []);
      setTypes((typesRes.data ?? []).filter((t) => t.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onChangeLevel = async (userId: string, level: number) => {
    setSavingId(userId);
    setRowError((p) => ({ ...p, [userId]: "" }));
    try {
      const res = await adminManagementApi.setAdminLevel(userId, level);
      if (res.data) {
        setAdmins((prev) =>
          prev.map((a) => (a.id === userId ? res.data! : a)),
        );
      }
    } catch (err) {
      setRowError((p) => ({
        ...p,
        [userId]: err instanceof Error ? err.message : "Failed to update",
      }));
    } finally {
      setSavingId(null);
    }
  };

  const typeLabel = (key: string) =>
    types.find((t) => t.key === key)?.label ?? key;

  const openTypeEditor = (a: AdminUser) => {
    setTypeEditId(a.id);
    setTypeDraft(new Set(a.user_types));
    setRowError((p) => ({ ...p, [a.id]: "" }));
  };

  const toggleDraft = (key: string) => {
    setTypeDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveTypes = async (userId: string) => {
    setSavingTypesId(userId);
    setRowError((p) => ({ ...p, [userId]: "" }));
    try {
      const res = await adminUserTypesApi.assign(userId, [...typeDraft]);
      if (res.data) {
        setAdmins((prev) => prev.map((a) => (a.id === userId ? res.data! : a)));
      }
      setTypeEditId(null);
    } catch (err) {
      setRowError((p) => ({
        ...p,
        [userId]: err instanceof Error ? err.message : "Failed to update",
      }));
    } finally {
      setSavingTypesId(null);
    }
  };

  // Level 0 (baseline) is always selectable even though it's not in `levels`
  // unless seeded; build a deduped, sorted option list.
  const levelOptions = [
    { level: 0, name: "Baseline (0)" },
    ...levels
      .filter((l) => l.level !== 0)
      .sort((a, b) => a.level - b.level)
      .map((l) => ({ level: l.level, name: `${l.name} (${l.level})` })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-dashboard-muted">{error}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-dashboard-border/60 px-3 py-1.5 text-sm text-dashboard-heading hover:bg-dashboard-bg"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-dashboard-muted">
          {admins.length} admin{admins.length === 1 ? "" : "s"}. Level 0 grants
          nothing until you assign a higher level.
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-dashboard-border/60 px-3 py-1.5 text-xs text-dashboard-heading hover:bg-dashboard-bg"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-dashboard-border/60 text-left text-xs uppercase tracking-wider text-dashboard-muted">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Permission level</th>
              <th className="px-4 py-3 font-semibold">User types</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const name =
                [a.first_name, a.last_name].filter(Boolean).join(" ") || "—";
              const editingTypes = typeEditId === a.id;
              return (
                <Fragment key={a.id}>
                <tr className="border-b border-dashboard-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium text-dashboard-heading">
                    {name}
                  </td>
                  <td className="px-4 py-3 text-dashboard-muted">
                    {a.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-dashboard-bg px-2 py-0.5 text-xs font-medium capitalize text-dashboard-heading">
                      {a.role ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={a.permission_level}
                        disabled={
                          !canManage || a.role === "admin" || savingId === a.id
                        }
                        onChange={(e) =>
                          onChangeLevel(a.id, Number(e.target.value))
                        }
                        className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-1.5 text-sm text-dashboard-heading disabled:opacity-60"
                      >
                        {/* Ensure the current value is always an option. */}
                        {!levelOptions.some(
                          (o) => o.level === a.permission_level,
                        ) && (
                          <option value={a.permission_level}>
                            Level {a.permission_level}
                          </option>
                        )}
                        {levelOptions.map((o) => (
                          <option key={o.level} value={o.level}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      {savingId === a.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-dashboard-muted" />
                      )}
                      {a.role === "admin" && (
                        <span className="text-xs text-dashboard-muted">
                          super-admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {editingTypes ? (
                      <div className="min-w-[200px] space-y-2">
                        {types.length === 0 ? (
                          <p className="text-xs text-dashboard-muted">
                            No types defined. Create one in the User Types tab.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {types.map((t) => (
                              <label
                                key={t.key}
                                className="flex items-center gap-2 text-sm text-dashboard-heading"
                              >
                                <input
                                  type="checkbox"
                                  checked={typeDraft.has(t.key)}
                                  onChange={() => toggleDraft(t.key)}
                                  className="h-4 w-4"
                                />
                                {t.label}
                              </label>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveTypes(a.id)}
                            disabled={savingTypesId === a.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-bg-primary px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                          >
                            {savingTypesId === a.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={() => setTypeEditId(null)}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashboard-border/60 px-2.5 py-1 text-xs text-dashboard-heading hover:bg-dashboard-bg"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {a.user_types.length > 0 ? (
                          a.user_types.map((k) => (
                            <span
                              key={k}
                              className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700"
                            >
                              {typeLabel(k)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-dashboard-muted">—</span>
                        )}
                        {canManage && (
                          <button
                            onClick={() => openTypeEditor(a)}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashboard-border/60 px-2 py-0.5 text-xs text-dashboard-muted hover:bg-dashboard-bg"
                          >
                            <Tags className="h-3 w-3" /> Manage
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                {rowError[a.id] && (
                  <tr>
                    <td colSpan={5} className="px-4 pb-2 text-xs text-red-500">
                      {rowError[a.id]}
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
            {admins.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-dashboard-muted"
                >
                  No admin users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
