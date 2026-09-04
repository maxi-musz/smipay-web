"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Lock,
  Info,
} from "lucide-react";
import { adminManagementApi } from "@/services/admin/management-api";
import type {
  AccessLevel,
  Crud,
  LevelEffective,
} from "@/types/admin/management";

interface Props {
  canManage: boolean;
  modulesVersion: number;
}

const NONE: Crud = {
  can_read: false,
  can_write: false,
  can_update: false,
  can_delete: false,
};

const ACTIONS: { key: keyof Crud; label: string }[] = [
  { key: "can_read", label: "Read" },
  { key: "can_write", label: "Write" },
  { key: "can_update", label: "Update" },
  { key: "can_delete", label: "Delete" },
];

export function LevelManager({ canManage, modulesVersion }: Props) {
  const [levels, setLevels] = useState<AccessLevel[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<number | null>(null);
  const [effective, setEffective] = useState<LevelEffective | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [own, setOwn] = useState<Record<string, Crud>>({});
  const [saving, setSaving] = useState(false);
  const [matrixMsg, setMatrixMsg] = useState<string | null>(null);

  const [newLevel, setNewLevel] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadLevels = useCallback(async () => {
    setLoadingLevels(true);
    setError(null);
    try {
      const res = await adminManagementApi.listLevels();
      setLevels(res.data?.levels ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load levels");
    } finally {
      setLoadingLevels(false);
    }
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const loadMatrix = useCallback(async (level: number) => {
    setLoadingMatrix(true);
    setMatrixMsg(null);
    try {
      const res = await adminManagementApi.getLevelEffective(level);
      const data = res.data ?? null;
      setEffective(data);
      setOwn(
        data
          ? Object.fromEntries(data.modules.map((m) => [m.key, { ...m.own }]))
          : {},
      );
    } catch (err) {
      setMatrixMsg(err instanceof Error ? err.message : "Failed to load matrix");
      setEffective(null);
    } finally {
      setLoadingMatrix(false);
    }
  }, []);

  // Reload the open matrix when the module registry changes.
  useEffect(() => {
    if (selected != null && selected >= 1) loadMatrix(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesVersion]);

  const selectLevel = (level: number) => {
    setSelected(level);
    setMatrixMsg(null);
    if (level >= 1) loadMatrix(level);
    else {
      setEffective(null);
      setOwn({});
    }
  };

  const toggleCell = (moduleKey: string, action: keyof Crud) => {
    setOwn((prev) => {
      const cur = prev[moduleKey] ?? { ...NONE };
      return { ...prev, [moduleKey]: { ...cur, [action]: !cur[action] } };
    });
  };

  const saveMatrix = async () => {
    if (selected == null || !effective) return;
    setSaving(true);
    setMatrixMsg(null);
    try {
      // Clean own delta: drop anything already inherited so grants stay minimal.
      const grants = effective.modules
        .map((m) => {
          const o = own[m.key] ?? NONE;
          const inh = m.inherited;
          return {
            module_key: m.key,
            can_read: o.can_read && !inh.can_read,
            can_write: o.can_write && !inh.can_write,
            can_update: o.can_update && !inh.can_update,
            can_delete: o.can_delete && !inh.can_delete,
          };
        })
        .filter(
          (g) => g.can_read || g.can_write || g.can_update || g.can_delete,
        );

      const res = await adminManagementApi.setGrants(selected, grants);
      const data = res.data ?? null;
      setEffective(data);
      setOwn(
        data
          ? Object.fromEntries(data.modules.map((m) => [m.key, { ...m.own }]))
          : {},
      );
      setMatrixMsg("Saved");
      loadLevels();
    } catch (err) {
      setMatrixMsg(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const createLevel = async () => {
    setCreateError(null);
    const n = Number(newLevel);
    if (!Number.isInteger(n) || n < 1) {
      setCreateError("Level must be an integer ≥ 1");
      return;
    }
    if (levels.some((l) => l.level === n)) {
      setCreateError(`Level ${n} already exists`);
      return;
    }
    if (!newName.trim()) {
      setCreateError("Name is required");
      return;
    }
    setCreating(true);
    try {
      await adminManagementApi.createLevel({ level: n, name: newName.trim() });
      setNewLevel("");
      setNewName("");
      await loadLevels();
      selectLevel(n);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const deleteLevel = async (level: number) => {
    if (!confirm(`Delete level ${level}?`)) return;
    try {
      await adminManagementApi.deleteLevel(level);
      if (selected === level) {
        setSelected(null);
        setEffective(null);
      }
      await loadLevels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const selectedMeta = levels.find((l) => l.level === selected) ?? null;

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <div className="border-b border-dashboard-border/60 px-4 py-3">
        <h2 className="text-sm font-bold text-dashboard-heading">
          Permission levels
        </h2>
        <p className="text-xs text-dashboard-muted">
          Higher levels inherit every grant of the levels below them. Inherited
          cells are locked — you can only add on top.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[240px_1fr]">
        {/* Levels list */}
        <div className="border-b border-dashboard-border/60 p-3 lg:border-b-0 lg:border-r">
          {loadingLevels ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-dashboard-muted" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-xs text-dashboard-muted">{error}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {levels.map((l) => (
                <button
                  key={l.level}
                  onClick={() => selectLevel(l.level)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected === l.level
                      ? "bg-brand-bg-primary text-white"
                      : "text-dashboard-heading hover:bg-dashboard-bg"
                  }`}
                >
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">L{l.level}</span> · {l.name}
                  </span>
                  {l.level === 0 && (
                    <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  )}
                </button>
              ))}
              {levels.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-dashboard-muted">
                  No levels yet.
                </p>
              )}
            </div>
          )}

          {canManage && (
            <div className="mt-3 space-y-2 rounded-lg border border-dashed border-dashboard-border/60 p-2.5">
              <p className="text-xs font-medium text-dashboard-muted">
                New level
              </p>
              <div className="flex gap-2">
                <input
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  type="number"
                  min={1}
                  placeholder="#"
                  className="w-14 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2 py-1.5 text-sm"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="min-w-0 flex-1 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2 py-1.5 text-sm"
                />
              </div>
              {createError && (
                <p className="text-xs text-red-500">{createError}</p>
              )}
              <button
                onClick={createLevel}
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create level
              </button>
            </div>
          )}
        </div>

        {/* Matrix */}
        <div className="min-w-0 p-3">
          {selected == null ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-dashboard-muted">
              <Info className="h-7 w-7" />
              <p className="text-sm">Select a level to edit its access.</p>
            </div>
          ) : selected === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-dashboard-muted">
              <Lock className="h-7 w-7" />
              <p className="max-w-xs text-sm">
                Level 0 is the baseline and grants nothing. Assign access to
                level 1 and above.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-dashboard-heading">
                    Level {selected}
                    {selectedMeta ? ` · ${selectedMeta.name}` : ""}
                  </h3>
                  <p className="text-xs text-dashboard-muted">
                    Tick to grant at this level. Locked ticks are inherited from
                    lower levels.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {matrixMsg && (
                    <span
                      className={`text-xs ${
                        matrixMsg === "Saved"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {matrixMsg}
                    </span>
                  )}
                  {canManage && (
                    <>
                      <button
                        onClick={saveMatrix}
                        disabled={saving || loadingMatrix}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => deleteLevel(selected)}
                        className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                        title="Delete level"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {loadingMatrix ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
                </div>
              ) : effective ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-dashboard-border/60 text-xs uppercase tracking-wider text-dashboard-muted">
                        <th className="px-3 py-2 text-left font-semibold">
                          Module
                        </th>
                        {ACTIONS.map((a) => (
                          <th
                            key={a.key}
                            className="px-3 py-2 text-center font-semibold"
                          >
                            {a.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {effective.modules.map((m) => {
                        const o = own[m.key] ?? NONE;
                        return (
                          <tr
                            key={m.key}
                            className="border-b border-dashboard-border/40 last:border-0"
                          >
                            <td className="px-3 py-2 font-medium text-dashboard-heading">
                              <span className={m.parent_key ? "pl-4" : ""}>
                                {m.label}
                              </span>
                              {!m.is_active && (
                                <span className="ml-2 text-[10px] text-dashboard-muted">
                                  (hidden)
                                </span>
                              )}
                            </td>
                            {ACTIONS.map((a) => {
                              const inherited = m.inherited[a.key];
                              const checked = inherited || o[a.key];
                              const disabled =
                                inherited || !canManage || saving;
                              return (
                                <td
                                  key={a.key}
                                  className="px-3 py-2 text-center"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggleCell(m.key, a.key)}
                                    title={
                                      inherited
                                        ? "Inherited from a lower level"
                                        : undefined
                                    }
                                    className={`h-4 w-4 rounded accent-[color:var(--brand-bg-primary,#ea6c0b)] ${
                                      inherited
                                        ? "cursor-not-allowed opacity-70"
                                        : "cursor-pointer"
                                    }`}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <AlertCircle className="h-7 w-7 text-red-500" />
                  <p className="text-sm text-dashboard-muted">
                    {matrixMsg ?? "Could not load the matrix."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
