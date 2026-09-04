"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  RotateCcw,
  Save,
  Lock,
  CornerDownRight,
} from "lucide-react";
import { adminManagementApi } from "@/services/admin/management-api";
import { useAuth } from "@/hooks/useAuth";
import type {
  AdminGrants,
  AdminModuleGrant,
  AdminUser,
  Crud,
  GrantItem,
} from "@/types/admin/management";
import {
  SIDEBAR_SECTIONS,
  sectionIdForModule,
} from "../../_components/sidebar-sections";

const EMPTY: Crud = {
  can_read: false,
  can_write: false,
  can_update: false,
  can_delete: false,
};

type CrudKey = keyof Crud;

const ACTIONS: { key: CrudKey; label: string }[] = [
  { key: "can_read", label: "Read" },
  { key: "can_write", label: "Write" },
  { key: "can_update", label: "Update" },
  { key: "can_delete", label: "Delete" },
];

interface TreeNode {
  mod: AdminModuleGrant;
  children: AdminModuleGrant[];
}

interface SectionGroup {
  id: string;
  label: string;
  nodes: TreeNode[];
}

/** Section → top-level tab → child tabs, mirroring the sidebar layout. */
function buildSections(modules: AdminModuleGrant[]): SectionGroup[] {
  const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);
  const tops = sorted.filter((m) => !m.parent_key);
  const bySection = new Map<string, TreeNode[]>();
  for (const t of tops) {
    const sid = sectionIdForModule(t.key);
    const arr = bySection.get(sid) ?? [];
    arr.push({
      mod: t,
      children: sorted.filter((m) => m.parent_key === t.key),
    });
    bySection.set(sid, arr);
  }
  return SIDEBAR_SECTIONS.filter((s) => bySection.has(s.id)).map((s) => ({
    id: s.id,
    label: s.label,
    nodes: bySection.get(s.id)!,
  }));
}

/**
 * The editable matrix for one admin. Starts from what currently applies:
 * their custom rows when they have any, their level defaults otherwise —
 * saving always persists the whole matrix as that admin's custom permissions.
 */
function draftFromData(d: AdminGrants): Record<string, Crud> {
  const out: Record<string, Crud> = {};
  for (const m of d.modules) {
    out[m.key] = d.has_custom
      ? { ...(m.own ?? EMPTY) }
      : d.full_access_default
        ? { ...m.effective } // start from "everything" and take tabs away
        : { ...m.level_default };
  }
  return out;
}

const sameCrud = (a: Crud, b: Crud) =>
  a.can_read === b.can_read &&
  a.can_write === b.can_write &&
  a.can_update === b.can_update &&
  a.can_delete === b.can_delete;

interface Props {
  canManage: boolean;
}

export function PermissionsTab({ canManage }: Props) {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [data, setData] = useState<AdminGrants | null>(null);
  const [draft, setDraft] = useState<Record<string, Crud>>({});
  const [baseline, setBaseline] = useState<Record<string, Crud>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const loadAdmins = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await adminManagementApi.listAdmins();
      setAdmins(res.data ?? []);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Failed to load admins",
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const applyData = useCallback((d: AdminGrants) => {
    setData(d);
    const next = draftFromData(d);
    setDraft(next);
    setBaseline(structuredClone(next));
  }, []);

  const loadDetail = useCallback(
    async (userId: string) => {
      setDetailLoading(true);
      setDetailError(null);
      setSaveError(null);
      try {
        const res = await adminManagementApi.getAdminGrants(userId);
        if (res.data) applyData(res.data);
      } catch (err) {
        setData(null);
        setDetailError(
          err instanceof Error ? err.message : "Failed to load permissions",
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [applyData],
  );

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const sections = useMemo(
    () => (data ? buildSections(data.modules) : []),
    [data],
  );

  /** Top-level key → its children's keys (for the uncheck-parent cascade). */
  const childKeysOf = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of data?.modules ?? []) {
      if (!m.parent_key) continue;
      const arr = map.get(m.parent_key) ?? [];
      arr.push(m.key);
      map.set(m.parent_key, arr);
    }
    return map;
  }, [data]);

  const fullDefault = data?.full_access_default ?? false;
  // You can't edit your own permissions (backend enforces this too).
  const isSelf = !!data && data.admin.id === currentUser?.id;
  const editable = canManage && !isSelf && !detailLoading;

  const dirty = useMemo(
    () =>
      Object.keys(draft).some(
        (k) => !sameCrud(draft[k], baseline[k] ?? EMPTY),
      ),
    [draft, baseline],
  );

  const toggle = (key: string, action: CrudKey, parentKey: string | null) => {
    if (!editable) return;
    setDraft((prev) => {
      const next = { ...prev };
      const row = { ...(next[key] ?? EMPTY) };
      const value = !row[action];

      if (action === "can_read" && !value) {
        // Hiding a tab clears its other flags; hiding a parent hides children.
        next[key] = { ...EMPTY };
        for (const c of childKeysOf.get(key) ?? []) next[c] = { ...EMPTY };
        return next;
      }

      row[action] = value;
      if (value) row.can_read = true; // any capability implies visibility
      next[key] = row;
      if (value && parentKey) {
        // A visible child needs its parent group visible too.
        next[parentKey] = { ...(next[parentKey] ?? EMPTY), can_read: true };
      }
      return next;
    });
  };

  const setSectionRead = (section: SectionGroup, on: boolean) => {
    if (!editable) return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const node of section.nodes) {
        if (on) {
          next[node.mod.key] = {
            ...(next[node.mod.key] ?? EMPTY),
            can_read: true,
          };
          for (const c of node.children) {
            next[c.key] = { ...(next[c.key] ?? EMPTY), can_read: true };
          }
        } else {
          next[node.mod.key] = { ...EMPTY };
          for (const c of node.children) next[c.key] = { ...EMPTY };
        }
      }
      return next;
    });
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const grants: GrantItem[] = Object.entries(draft)
        .filter(
          ([, c]) => c.can_read || c.can_write || c.can_update || c.can_delete,
        )
        .map(([module_key, c]) => ({ module_key, ...c }));
      const res = await adminManagementApi.setAdminGrants(selectedId, grants);
      if (res.data) applyData(res.data);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resetToLevel = async () => {
    if (!selectedId || !data) return;
    const fallback =
      data.admin.role === "admin"
        ? "full access"
        : `their level ${data.admin.permission_level} defaults`;
    const ok = window.confirm(
      `Remove all custom permissions for ${data.admin.email ?? "this admin"}? ` +
        `They will go back to ${fallback}.`,
    );
    if (!ok) return;
    setResetting(true);
    setSaveError(null);
    try {
      const res = await adminManagementApi.resetAdminGrants(selectedId);
      if (res.data) applyData(res.data);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setResetting(false);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = [a.first_name, a.last_name].filter(Boolean).join(" ");
    return (
      name.toLowerCase().includes(q) ||
      (a.email ?? "").toLowerCase().includes(q)
    );
  });

  const selected = admins.find((a) => a.id === selectedId) ?? null;

  const renderRow = (
    mod: AdminModuleGrant,
    parentKey: string | null,
  ) => {
    const crud = draft[mod.key] ?? EMPTY;
    return (
      <div
        key={mod.key}
        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
          parentKey ? "ml-7" : ""
        } ${crud.can_read ? "bg-orange-50/60" : ""} ${
          mod.is_active ? "" : "opacity-50"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {parentKey && (
            <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-dashboard-muted" />
          )}
          <span className="truncate text-sm font-medium text-dashboard-heading">
            {mod.label}
          </span>
          {!mod.is_active && (
            <span className="shrink-0 rounded bg-dashboard-bg px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-dashboard-muted">
              inactive
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {ACTIONS.map((a) => (
            <label
              key={a.key}
              className={`flex items-center gap-1.5 text-xs ${
                editable ? "cursor-pointer" : "cursor-default"
              } ${crud[a.key] ? "text-dashboard-heading" : "text-dashboard-muted"}`}
            >
              <input
                type="checkbox"
                checked={crud[a.key]}
                disabled={!editable}
                onChange={() => toggle(mod.key, a.key, parentKey)}
                className="h-4 w-4 accent-orange-600"
              />
              <span className="hidden sm:inline">{a.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (listLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
      </div>
    );
  }

  if (listError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-dashboard-muted">{listError}</p>
        <button
          onClick={loadAdmins}
          className="inline-flex items-center gap-2 rounded-lg border border-dashboard-border/60 px-3 py-1.5 text-sm text-dashboard-heading hover:bg-dashboard-bg"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
      {/* Admin list — sticks in place while the matrix scrolls */}
      <div className="h-fit rounded-xl border border-dashboard-border/60 bg-dashboard-surface lg:sticky lg:top-28">
        <div className="border-b border-dashboard-border/60 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admins…"
              className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg py-2 pl-8 pr-3 text-sm text-dashboard-heading placeholder:text-dashboard-muted focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
        </div>
        <div className="max-h-[520px] overflow-y-auto p-2 lg:max-h-[calc(100vh-16rem)]">
          {filteredAdmins.map((a) => {
            const name =
              [a.first_name, a.last_name].filter(Boolean).join(" ") ||
              a.email ||
              "—";
            const active = a.id === selectedId;
            const isMe = a.id === currentUser?.id;
            const fullAccess = a.role === "admin" && !a.has_custom;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-brand-bg-primary text-white"
                    : "hover:bg-dashboard-bg"
                }`}
              >
                <p
                  className={`truncate text-sm font-medium ${
                    active ? "text-white" : "text-dashboard-heading"
                  }`}
                >
                  {name}
                  {isMe && (
                    <span
                      className={`ml-1.5 text-xs font-normal ${
                        active ? "text-white/80" : "text-dashboard-muted"
                      }`}
                    >
                      (you)
                    </span>
                  )}
                </p>
                <p
                  className={`truncate text-xs ${
                    active ? "text-white/80" : "text-dashboard-muted"
                  }`}
                >
                  {a.email ?? "—"}
                </p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    active
                      ? "bg-white/20 text-white"
                      : a.has_custom
                        ? "bg-orange-50 text-orange-700"
                        : "bg-dashboard-bg text-dashboard-muted"
                  }`}
                >
                  {a.has_custom ? (
                    <>Custom</>
                  ) : fullAccess ? (
                    <>
                      <ShieldCheck className="h-3 w-3" /> Full access
                    </>
                  ) : (
                    <>Level {a.permission_level}</>
                  )}
                </span>
              </button>
            );
          })}
          {filteredAdmins.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-dashboard-muted">
              No admins match your search.
            </p>
          )}
        </div>
      </div>

      {/* Permission matrix */}
      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
            <Lock className="h-8 w-8 text-dashboard-muted" />
            <p className="text-sm font-medium text-dashboard-heading">
              Select an admin
            </p>
            <p className="max-w-xs text-xs text-dashboard-muted">
              Pick an admin on the left to choose exactly which sidebar tabs
              they can see and what they can do in each.
            </p>
          </div>
        ) : detailLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
          </div>
        ) : detailError ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-dashboard-muted">{detailError}</p>
            <button
              onClick={() => loadDetail(selectedId)}
              className="inline-flex items-center gap-2 rounded-lg border border-dashboard-border/60 px-3 py-1.5 text-sm text-dashboard-heading hover:bg-dashboard-bg"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : data ? (
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashboard-border/60 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-dashboard-heading">
                  {[data.admin.first_name, data.admin.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                    data.admin.email ||
                    "—"}
                </p>
                <p className="text-xs text-dashboard-muted">
                  {isSelf ? (
                    "This is you — you can't edit your own permissions; ask another full-access admin"
                  ) : data.has_custom ? (
                    <span className="font-medium text-orange-700">
                      Custom permissions
                    </span>
                  ) : fullDefault ? (
                    "Full access (no custom permissions yet) — uncheck tabs and save to restrict"
                  ) : (
                    `Using level ${data.admin.permission_level} defaults — saving creates custom permissions`
                  )}
                </p>
              </div>
              {editable && (
                <div className="flex items-center gap-2">
                  {data.has_custom && (
                    <button
                      type="button"
                      onClick={resetToLevel}
                      disabled={resetting || saving}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashboard-border/60 px-3 py-1.5 text-xs font-medium text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-60"
                    >
                      {resetting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Reset to defaults
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={save}
                    disabled={!dirty || saving || resetting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg-primary px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {savedFlash && !dirty ? "Saved" : "Save changes"}
                  </button>
                </div>
              )}
            </div>

            {saveError && (
              <p className="border-b border-dashboard-border/60 bg-red-50 px-4 py-2 text-xs text-red-600">
                {saveError}
              </p>
            )}

            {/* Tree */}
            <div className="space-y-4 p-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-dashboard-border/60"
                >
                  <div className="flex items-center justify-between border-b border-dashboard-border/60 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                      {section.label}
                    </span>
                    {editable && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSectionRead(section, true)}
                          className="rounded px-1.5 py-0.5 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
                        >
                          All
                        </button>
                        <span className="text-dashboard-border">·</span>
                        <button
                          type="button"
                          onClick={() => setSectionRead(section, false)}
                          className="rounded px-1.5 py-0.5 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
                        >
                          None
                        </button>
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 p-2">
                    {section.nodes.map((node) => (
                      <div key={node.mod.key}>
                        {renderRow(node.mod, null)}
                        {node.children.map((c) => renderRow(c, node.mod.key))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {editable && (
              <p className="border-t border-dashboard-border/60 px-4 py-3 text-xs text-dashboard-muted">
                <strong>Read</strong> controls whether {selected?.first_name ||
                  "the admin"}{" "}
                sees the tab in their sidebar. Checking Write, Update or Delete
                turns Read on automatically; unchecking Read on a group hides
                everything inside it. Use &quot;Reset to defaults&quot; to
                remove all custom permissions again.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
