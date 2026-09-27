"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  Globe,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import type {
  EmailDomainRuleAction,
  EmailDomainRuleKind,
  EmailDomainRuleRow,
  GuardMode,
  IdentityGuardRule,
  RuleTypeDescriptor,
} from "@/types/admin/identity-guards";
import {
  Banner,
  errorMessage,
  fmtDateTime,
  fmtNumber,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  type GuardPerms,
} from "./shared";

const PREVIEW_COUNT = 10;

const humanize = (key: string) => {
  const text = key.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function allowlistStatus(
  rule: IdentityGuardRule,
  mode: GuardMode,
): { label: string; className: string } {
  if (mode === "off") {
    return { label: "Email is Off — not applied", className: "bg-slate-100 text-slate-700" };
  }
  if (rule.problem) {
    return { label: "Not running — every domain passes", className: "bg-red-100 text-red-700" };
  }
  if (!rule.enabled) {
    return { label: "Disabled — every domain passes", className: "bg-slate-100 text-slate-700" };
  }
  if (rule.action === "flag") {
    return { label: "Flags other domains", className: "bg-amber-100 text-amber-800" };
  }
  if (mode === "monitor") {
    return { label: "Would block other domains (Monitor)", className: "bg-violet-100 text-violet-700" };
  }
  return { label: "Blocking other domains", className: "bg-emerald-100 text-emerald-700" };
}

export function AllowlistPanel({
  rule,
  mode,
  ruleTypes,
  perms,
  restoring,
  onEdit,
  onRestore,
}: {
  rule: IdentityGuardRule | undefined;
  mode: GuardMode;
  ruleTypes: RuleTypeDescriptor[];
  perms: GuardPerms;
  restoring: boolean;
  onEdit: (rule: IdentityGuardRule) => void;
  onRestore: () => void;
}) {
  const descriptors = rule
    ? (ruleTypes.find((t) => t.type === rule.type)?.params ?? [])
    : [];

  const lists = rule
    ? Object.entries(rule.params)
        .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
        .map(([key, values]) => ({
          key,
          label: descriptors.find((d) => d.key === key)?.label ?? humanize(key),
          help: descriptors.find((d) => d.key === key)?.help,
          values: values.map(String),
        }))
    : [];

  const status = rule ? allowlistStatus(rule, mode) : null;
  const canEdit = !!rule?.id && perms.canUpdate && !perms.locked;

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dashboard-border/60 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg">
            <ListChecks className="h-4 w-4 text-dashboard-heading" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-dashboard-heading">Email allowlist</h2>
              {status && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
                >
                  {status.label}
                </span>
              )}
            </div>
            <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-dashboard-muted">
              Throwaway-inbox domains change daily, so instead of chasing them
              the email field accepts known providers and stops the rest. This
              is the <span className="font-mono">email.trusted_providers</span>{" "}
              rule — edit its lists with the rule editor.
            </p>
          </div>
        </div>
        {rule && (
          <button
            type="button"
            onClick={() => onEdit(rule)}
            disabled={!canEdit}
            className={secondaryButtonClass}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit allowlist
          </button>
        )}
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-semibold text-dashboard-heading">
            An address passes when any one of these holds:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-relaxed text-dashboard-muted">
            <li>its domain is a trusted provider (Gmail, Yahoo, Outlook, iCloud, Proton, Zoho…);</li>
            <li>its domain ends in an allowed suffix (.edu.ng, .sch.ng, .gov.ng, .edu, .gov, .ac.uk);</li>
            <li>
              its mail servers (MX) belong to a paid host — Google Workspace,
              Microsoft 365, Zoho, enterprise gateways — which is how school and
              work email passes;
            </li>
            <li>an ALLOW domain entry in the lists below matches.</li>
          </ul>
          <p className="mt-1.5 text-xs text-dashboard-muted">
            If DNS doesn&apos;t answer, the address is only flagged — never
            blocked. Mail forwarders (Cloudflare routing, ImprovMX…) don&apos;t
            count as a paid host.
          </p>
        </div>

        {!rule ? (
          <Banner
            tone="warn"
            action={
              <button
                type="button"
                onClick={onRestore}
                disabled={restoring || !perms.canWrite || perms.locked}
                className={secondaryButtonClass}
              >
                {restoring ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Undo2 className="h-3.5 w-3.5" />
                )}
                Restore email defaults
              </button>
            }
          >
            The allowlist rule has been deleted, so domains that aren&apos;t on it
            are no longer stopped.
          </Banner>
        ) : lists.length === 0 ? (
          <p className="text-xs text-dashboard-muted">This rule has no lists configured.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {lists.map((list) => (
              <div
                key={list.key}
                className="rounded-lg border border-dashboard-border/50 p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-dashboard-heading">
                    {list.label}
                  </p>
                  <span className="text-[11px] tabular-nums text-dashboard-muted">
                    {list.values.length}
                  </span>
                </div>
                {list.help && (
                  <p className="mt-0.5 text-[11px] text-dashboard-muted">{list.help}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {list.values.slice(0, PREVIEW_COUNT).map((v) => (
                    <span
                      key={v}
                      className="rounded bg-dashboard-bg px-1.5 py-0.5 font-mono text-[10px] text-dashboard-heading"
                    >
                      {v}
                    </span>
                  ))}
                  {list.values.length > PREVIEW_COUNT && (
                    <span className="px-1 py-0.5 text-[10px] text-dashboard-muted">
                      +{list.values.length - PREVIEW_COUNT} more
                    </span>
                  )}
                  {list.values.length === 0 && (
                    <span className="text-[11px] text-dashboard-muted">Empty</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type ActionFilter = "all" | EmailDomainRuleAction;

const KIND_LABEL: Record<EmailDomainRuleKind, string> = {
  DOMAIN: "Domain",
  MX_HOST: "MX host",
};

const cleanPattern = (raw: string) =>
  raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^.*@/, "").replace(/\/.*$/, "");

function patternProblem(pattern: string): string | null {
  if (!pattern) return "Enter a domain or host.";
  if (/\s/.test(pattern)) return "No spaces.";
  if (!/^\.?[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(pattern)) {
    return "Use a domain like mailinator.com (or .mailinator.com for its subdomains).";
  }
  return null;
}

export function DomainListsPanel({ perms }: { perms: GuardPerms }) {
  const [rows, setRows] = useState<EmailDomainRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [filter, setFilter] = useState<ActionFilter>("all");
  const [search, setSearch] = useState("");

  const [pattern, setPattern] = useState("");
  const [kind, setKind] = useState<EmailDomainRuleKind>("DOMAIN");
  const [action, setAction] = useState<EmailDomainRuleAction>("BLOCK");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    pattern: "",
    action: "BLOCK" as EmailDomainRuleAction,
    note: "",
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const canAdd = perms.canWrite && !perms.locked;
  const canEdit = perms.canUpdate && !perms.locked;
  const canDelete = perms.canDelete && !perms.locked;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminIdentityGuardsApi.listEmailDomainRules());
    } catch (e) {
      setError(errorMessage(e, "Could not load the domain lists"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => filter === "all" || r.action === filter)
      .filter(
        (r) =>
          !q ||
          r.pattern.includes(q) ||
          (r.note ?? "").toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          a.action.localeCompare(b.action) || a.pattern.localeCompare(b.pattern),
      );
  }, [rows, filter, search]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      ALLOW: rows.filter((r) => r.action === "ALLOW").length,
      BLOCK: rows.filter((r) => r.action === "BLOCK").length,
    }),
    [rows],
  );

  const cleanedPattern = cleanPattern(pattern);
  const addProblem = pattern ? patternProblem(cleanedPattern) : null;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const problem = patternProblem(cleanedPattern);
    if (problem) {
      setError(problem);
      return;
    }
    setAdding(true);
    setError(null);
    setNotice(null);
    try {
      const row = await adminIdentityGuardsApi.createEmailDomainRule({
        pattern: cleanedPattern,
        kind,
        action,
        note: note.trim() || undefined,
      });
      setRows((prev) => [...prev.filter((r) => r.id !== row.id), row]);
      setPattern("");
      setNote("");
      setNotice(
        `${row.action === "ALLOW" ? "Allowed" : "Blocked"} ${KIND_LABEL[row.kind].toLowerCase()} ${row.pattern}.`,
      );
    } catch (err) {
      setError(errorMessage(err, "Could not add the entry"));
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (row: EmailDomainRuleRow) => {
    setEditId(row.id);
    setConfirmDelete(null);
    setEditDraft({ pattern: row.pattern, action: row.action, note: row.note ?? "" });
  };

  const saveEdit = async (row: EmailDomainRuleRow) => {
    const next = cleanPattern(editDraft.pattern);
    const problem = patternProblem(next);
    if (problem) {
      setError(problem);
      return;
    }
    const patch: { pattern?: string; action?: EmailDomainRuleAction; note?: string } = {};
    if (next !== row.pattern) patch.pattern = next;
    if (editDraft.action !== row.action) patch.action = editDraft.action;
    if (editDraft.note.trim() !== (row.note ?? "")) patch.note = editDraft.note.trim();
    if (Object.keys(patch).length === 0) {
      setEditId(null);
      return;
    }

    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await adminIdentityGuardsApi.updateEmailDomainRule(row.id, patch);
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
      setEditId(null);
    } catch (err) {
      setError(errorMessage(err, "Could not save the entry"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row: EmailDomainRuleRow) => {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      await adminIdentityGuardsApi.deleteEmailDomainRule(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setConfirmDelete(null);
      setNotice(`Removed ${row.pattern}.`);
    } catch (err) {
      setError(errorMessage(err, "Could not remove the entry"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dashboard-border/60 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg">
            <Globe className="h-4 w-4 text-dashboard-heading" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-dashboard-heading">Domain &amp; MX lists</h2>
            <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-dashboard-muted">
              Hand-made exceptions for the email checks. <strong>Allow</strong> a
              real school or company domain the rules catch — it then skips the
              allowlist, every domain rule and the disposable dataset.{" "}
              <strong>Block</strong> a domain, or an MX host that serves many
              throwaway domains. Allow always wins over block.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={secondaryButtonClass}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        {canAdd && (
          <form
            onSubmit={add}
            className="grid grid-cols-1 gap-2 rounded-lg bg-dashboard-bg p-3 sm:grid-cols-[minmax(0,1.4fr)_auto_auto_minmax(0,1.4fr)_auto]"
          >
            <div>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={kind === "DOMAIN" ? "company.com.ng or .company.com.ng" : "mx.somehost.biz"}
                spellCheck={false}
                aria-label="Domain or MX host"
                className={`${inputClass} bg-dashboard-surface font-mono ${
                  addProblem ? "border-red-300" : ""
                }`}
              />
            </div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as EmailDomainRuleKind)}
              aria-label="Kind"
              className={`${inputClass} bg-dashboard-surface sm:w-auto`}
            >
              <option value="DOMAIN">Domain</option>
              <option value="MX_HOST">MX host</option>
            </select>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as EmailDomainRuleAction)}
              aria-label="Action"
              className={`${inputClass} bg-dashboard-surface sm:w-auto`}
            >
              <option value="BLOCK">Block</option>
              <option value="ALLOW">Allow</option>
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why (shown to other admins)"
              maxLength={200}
              aria-label="Note"
              className={`${inputClass} bg-dashboard-surface`}
            />
            <button
              type="submit"
              disabled={adding || !pattern.trim() || !!addProblem}
              className={`${primaryButtonClass} px-3`}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </button>
            {addProblem && (
              <p className="text-[11px] text-red-600 sm:col-span-5">{addProblem}</p>
            )}
          </form>
        )}

        {error && (
          <Banner tone="error" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}
        {notice && (
          <Banner tone="success" onDismiss={() => setNotice(null)}>
            {notice}
          </Banner>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5 text-xs font-medium">
            {(
              [
                ["all", "All"],
                ["ALLOW", "Allow"],
                ["BLOCK", "Block"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  filter === id
                    ? "bg-dashboard-surface text-dashboard-heading shadow-sm"
                    : "text-dashboard-muted hover:text-dashboard-heading"
                }`}
              >
                {label}
                <span className="ml-1 tabular-nums text-dashboard-muted">{counts[id]}</span>
              </button>
            ))}
          </div>
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dashboard-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pattern or note…"
              className={`${inputClass} py-1.5 pl-8 text-xs`}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-dashboard-border/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-dashboard-border/60 bg-dashboard-bg">
                <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                  <th className="px-3 py-2.5 font-medium">Pattern</th>
                  <th className="px-3 py-2.5 font-medium">Action</th>
                  <th className="min-w-[180px] px-3 py-2.5 font-medium">Note</th>
                  <th className="px-3 py-2.5 text-right font-medium">Hits</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-medium">Last hit</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {loading && rows.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-3 py-3">
                        <div className="h-4 animate-pulse rounded bg-dashboard-bg" />
                      </td>
                    </tr>
                  ))
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-dashboard-muted">
                      {rows.length === 0
                        ? "No entries yet. The disposable dataset and the allowlist handle most cases."
                        : "Nothing matches this filter."}
                    </td>
                  </tr>
                ) : (
                  visible.map((row) => {
                    const editing = editId === row.id;
                    const busy = busyId === row.id;
                    return (
                      <tr key={row.id} className="align-top">
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <input
                              value={editDraft.pattern}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, pattern: e.target.value }))
                              }
                              spellCheck={false}
                              className={`${inputClass} py-1 font-mono text-xs`}
                            />
                          ) : (
                            <span className="break-all font-mono text-xs text-dashboard-heading">
                              {row.pattern}
                            </span>
                          )}
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-dashboard-muted">
                            {KIND_LABEL[row.kind] ?? row.kind}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <select
                              value={editDraft.action}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  action: e.target.value as EmailDomainRuleAction,
                                }))
                              }
                              className={`${inputClass} py-1 text-xs`}
                            >
                              <option value="BLOCK">Block</option>
                              <option value="ALLOW">Allow</option>
                            </select>
                          ) : (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                row.action === "ALLOW"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {row.action === "ALLOW" ? "Allow" : "Block"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-dashboard-muted">
                          {editing ? (
                            <input
                              value={editDraft.note}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, note: e.target.value }))
                              }
                              maxLength={200}
                              className={`${inputClass} py-1 text-xs`}
                            />
                          ) : (
                            row.note || "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs tabular-nums text-dashboard-heading">
                          {fmtNumber(row.hit_count)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-dashboard-muted">
                          {row.last_hit_at ? fmtDateTime(row.last_hit_at) : "Never"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          {editing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => saveEdit(row)}
                                disabled={busy}
                                className="inline-flex h-7 items-center gap-1 rounded-md bg-brand-bg-primary px-2 text-[11px] font-semibold text-white disabled:opacity-50"
                              >
                                {busy ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditId(null)}
                                disabled={busy}
                                aria-label="Cancel"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : confirmDelete === row.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[11px] text-dashboard-heading">Remove?</span>
                              <button
                                type="button"
                                onClick={() => remove(row)}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                disabled={busy}
                                className="rounded-md border border-dashboard-border/60 px-2 py-1 text-[11px] font-medium text-dashboard-heading hover:bg-dashboard-bg"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                disabled={!canEdit}
                                title="Edit"
                                aria-label={`Edit ${row.pattern}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditId(null);
                                  setConfirmDelete(row.id);
                                }}
                                disabled={!canDelete}
                                title="Remove"
                                aria-label={`Remove ${row.pattern}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashboard-border/60 text-dashboard-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
