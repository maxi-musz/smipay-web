"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import type {
  GuardField,
  IdentityGuardConfigResponse,
  IdentityGuardRule,
  RuleAction,
} from "@/types/admin/identity-guards";
import { RuleEditorModal } from "./RuleEditorModal";
import { AllowlistPanel, DomainListsPanel } from "./EmailListsPanels";
import {
  ActionBadge,
  Banner,
  FIELD_META,
  ModeBadge,
  Switch,
  errorMessage,
  fieldInfo,
  fmtDateTime,
  fmtNumber,
  isRuleRunning,
  modeOf,
  primaryButtonClass,
  rulesFor,
  secondaryButtonClass,
  summarizeParams,
  type GuardPerms,
} from "./shared";

export function RulesTab({
  field,
  config,
  perms,
  onRuleSaved,
  onRuleRemoved,
  onReload,
}: {
  field: GuardField;
  config: IdentityGuardConfigResponse;
  perms: GuardPerms;
  onRuleSaved: (rule: IdentityGuardRule) => void;
  onRuleRemoved: (ruleId: string) => void;
  onReload: () => Promise<void>;
}) {
  const info = fieldInfo(config.fields, field);
  const mode = modeOf(config, field);
  const Icon = FIELD_META[field].icon;
  const noun = FIELD_META[field].noun;
  const rules = useMemo(() => rulesFor(config.rules, field), [config.rules, field]);

  const [editing, setEditing] = useState<{ rule: IdentityGuardRule | null } | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const enabledCount = rules.filter(isRuleRunning).length;
  const brokenCount = rules.filter((r) => r.problem).length;
  const canAdd = perms.canWrite && !perms.locked;

  const patchRule = async (
    rule: IdentityGuardRule,
    patch: { enabled?: boolean; action?: RuleAction },
  ) => {
    if (!rule.id) return;
    setBusyId(rule.id);
    setError(null);
    setNotice(null);
    try {
      onRuleSaved(await adminIdentityGuardsApi.updateRule(rule.id, patch));
    } catch (e) {
      setError(errorMessage(e, "Could not update the rule"));
    } finally {
      setBusyId(null);
    }
  };

  const resetRule = async (rule: IdentityGuardRule) => {
    if (!rule.id) return;
    setBusyId(rule.id);
    setError(null);
    setNotice(null);
    try {
      onRuleSaved(await adminIdentityGuardsApi.resetRule(rule.id));
      setNotice(`“${rule.label}” is back to its default settings.`);
    } catch (e) {
      setError(errorMessage(e, "Could not reset the rule"));
    } finally {
      setBusyId(null);
    }
  };

  const deleteRule = async (rule: IdentityGuardRule) => {
    if (!rule.id) return;
    setBusyId(rule.id);
    setError(null);
    setNotice(null);
    try {
      await adminIdentityGuardsApi.deleteRule(rule.id);
      onRuleRemoved(rule.id);
      setConfirmDelete(null);
      setNotice(
        rule.is_system
          ? `Deleted “${rule.label}”. “Restore defaults” brings it back.`
          : `Deleted “${rule.label}”.`,
      );
    } catch (e) {
      setError(errorMessage(e, "Could not delete the rule"));
    } finally {
      setBusyId(null);
    }
  };

  const restoreDefaults = async () => {
    setRestoring(true);
    setError(null);
    setNotice(null);
    try {
      const res = await adminIdentityGuardsApi.restoreDefaults(field);
      await onReload();
      setNotice(
        res.created > 0
          ? `Added ${res.created} default ${noun} rule${res.created === 1 ? "" : "s"}.`
          : `Every default ${noun} rule is already present — nothing to add.`,
      );
    } catch (e) {
      setError(errorMessage(e, "Could not restore the default rules"));
    } finally {
      setRestoring(false);
    }
  };

  const allowlistRule =
    field === "email"
      ? (rules.find((r) => r.key === "email.trusted_providers") ??
        rules.find((r) => r.type.includes("allowlist")))
      : undefined;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dashboard-border/60 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg">
              <Icon className="h-4.5 w-4.5 text-dashboard-heading" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-dashboard-heading">
                  {info.label} rules
                </h2>
                <ModeBadge mode={mode} />
                <span className="text-[11px] text-dashboard-muted">
                  {enabledCount} of {rules.length} on
                </span>
              </div>
              {info.description && (
                <p className="mt-0.5 text-xs text-dashboard-muted">{info.description}</p>
              )}
              <p className="mt-1 flex items-start gap-1.5 text-xs text-dashboard-heading">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>
                  <span className="font-semibold">Floor, always on:</span> {info.floor}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rules.length > 0 && (
              <button
                type="button"
                onClick={restoreDefaults}
                disabled={!canAdd || restoring}
                title="Re-adds any default rule that was deleted. Your edits are kept."
                className={secondaryButtonClass}
              >
                {restoring ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Undo2 className="h-3.5 w-3.5" />
                )}
                Restore defaults
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing({ rule: null })}
              disabled={!canAdd}
              className={`${primaryButtonClass} px-3 py-2 text-xs`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add rule
            </button>
          </div>
        </header>

        <div className="space-y-3 px-4 py-4 sm:px-5">
          {mode === "off" && (
            <Banner tone="warn">
              {info.label} is <strong>Off</strong>: none of these rules run. Only
              the floor check applies.
            </Banner>
          )}
          {mode === "monitor" && (
            <Banner tone="info">
              {info.label} is in <strong>Monitor</strong>: block rules only log
              “would block” in Activity; nobody is stopped by a rule yet.
            </Banner>
          )}
          {field === "bvn" && config.notes?.bvn_sandbox && (
            <Banner tone="info">
              Dojah is in sandbox, so the Dojah BVN flows skip these rules
              (sandbox test BVNs repeat digits). The 11-digit floor still
              applies, and other BVN paths keep every rule.
            </Banner>
          )}
          {brokenCount > 0 && (
            <Banner tone="warn">
              <strong>
                {brokenCount === 1
                  ? "1 rule below isn't running"
                  : `${brokenCount} rules below aren't running`}
              </strong>
              : the guard skips a rule whose saved settings it can&apos;t read,
              even when it&apos;s switched on. Each one says why — edit or
              delete it.
            </Banner>
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

          {rules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-dashboard-border/60 px-4 py-8 text-center">
              <p className="text-sm font-medium text-dashboard-heading">
                No {noun} rules
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-dashboard-muted">
                Only the floor check runs for this field. Load the recommended
                defaults, or add your own rule.
              </p>
              <button
                type="button"
                onClick={restoreDefaults}
                disabled={!canAdd || restoring}
                className={`${primaryButtonClass} mt-4`}
              >
                {restoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Load default rules
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-dashboard-border/60">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-dashboard-border/60 bg-dashboard-bg">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                      <th className="w-12 px-3 py-2.5 font-medium">On</th>
                      <th className="min-w-[280px] px-3 py-2.5 font-medium">Rule</th>
                      <th className="px-3 py-2.5 font-medium">Action</th>
                      <th className="px-3 py-2.5 text-right font-medium">Hits</th>
                      <th className="whitespace-nowrap px-3 py-2.5 font-medium">Last hit</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashboard-border/40">
                    {rules.map((rule) => (
                      <RuleRow
                        key={rule.key}
                        rule={rule}
                        paramDescriptors={
                          config.rule_types.find((t) => t.type === rule.type)?.params
                        }
                        perms={perms}
                        busy={busyId !== null && busyId === rule.id}
                        confirmingDelete={confirmDelete !== null && confirmDelete === rule.id}
                        onToggle={(enabled) => patchRule(rule, { enabled })}
                        onAction={(action) => patchRule(rule, { action })}
                        onEdit={() => setEditing({ rule })}
                        onReset={() => resetRule(rule)}
                        onAskDelete={() => setConfirmDelete(rule.id)}
                        onCancelDelete={() => setConfirmDelete(null)}
                        onDelete={() => deleteRule(rule)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rules.some((r) => r.id === null) && !perms.locked && (
            <p className="text-[11px] text-dashboard-muted">
              These rules are the built-in defaults and haven&apos;t been saved
              yet — reload the page to finish setting them up.
            </p>
          )}
        </div>
      </section>

      {field === "email" && (
        <>
          <AllowlistPanel
            rule={allowlistRule}
            mode={mode}
            ruleTypes={config.rule_types}
            perms={perms}
            restoring={restoring}
            onEdit={(rule) => setEditing({ rule })}
            onRestore={restoreDefaults}
          />
          <DomainListsPanel perms={perms} />
        </>
      )}

      {editing && (
        <RuleEditorModal
          key={editing.rule?.id ?? "new"}
          field={field}
          fields={config.fields}
          mode={mode}
          ruleTypes={config.rule_types}
          rule={editing.rule}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            onRuleSaved(saved);
            setEditing(null);
            setError(null);
            setNotice(
              editing.rule ? `Saved “${saved.label}”.` : `Added “${saved.label}”.`,
            );
          }}
        />
      )}
    </div>
  );
}

function RuleRow({
  rule,
  paramDescriptors,
  perms,
  busy,
  confirmingDelete,
  onToggle,
  onAction,
  onEdit,
  onReset,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  rule: IdentityGuardRule;
  paramDescriptors: Parameters<typeof summarizeParams>[1];
  perms: GuardPerms;
  busy: boolean;
  confirmingDelete: boolean;
  onToggle: (enabled: boolean) => void;
  onAction: (action: RuleAction) => void;
  onEdit: () => void;
  onReset: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const editable = rule.id !== null && !perms.locked;
  const canUpdate = editable && perms.canUpdate;
  const canDelete = editable && perms.canDelete;
  const chips = summarizeParams(rule.params, paramDescriptors);

  return (
    <tr className={`align-top ${rule.enabled ? "" : "bg-dashboard-bg/40"}`}>
      <td className="px-3 py-3">
        <Switch
          checked={rule.enabled}
          disabled={!canUpdate || busy}
          onChange={onToggle}
          label={`${rule.enabled ? "Disable" : "Enable"} ${rule.label}`}
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-sm font-medium ${
              rule.enabled ? "text-dashboard-heading" : "text-dashboard-muted"
            }`}
          >
            {rule.label}
          </span>
          {!rule.is_system && (
            <span className="rounded bg-blue-50 px-1.5 py-px text-[10px] font-semibold text-blue-700">
              Custom
            </span>
          )}
          {rule.is_system && rule.is_modified && (
            <span
              className="rounded bg-violet-50 px-1.5 py-px text-[10px] font-semibold text-violet-700"
              title="Differs from the shipped default"
            >
              Modified
            </span>
          )}
          {rule.message && (
            <span
              className="rounded bg-dashboard-bg px-1.5 py-px text-[10px] font-medium text-dashboard-muted"
              title={rule.message}
            >
              Custom message
            </span>
          )}
          {rule.problem && (
            <span
              className="rounded bg-red-50 px-1.5 py-px text-[10px] font-semibold text-red-700"
              title={rule.problem}
            >
              Not running
            </span>
          )}
        </div>
        {rule.problem && (
          <p className="mt-0.5 text-xs font-medium text-red-700">
            Skipped by the guard: {rule.problem}
          </p>
        )}
        {rule.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-dashboard-muted">
            {rule.description}
          </p>
        )}
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded bg-dashboard-bg px-1.5 py-0.5 text-[10px] text-dashboard-heading"
              >
                {c}
              </span>
            ))}
          </div>
        )}
        <p className="mt-1 font-mono text-[10px] text-dashboard-muted">{rule.key}</p>
      </td>
      <td className="px-3 py-3">
        {canUpdate ? (
          <select
            value={rule.action}
            disabled={busy}
            onChange={(e) => onAction(e.target.value as RuleAction)}
            aria-label={`Action for ${rule.label}`}
            className={`rounded-md border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-50 ${
              rule.action === "block"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <option value="block">Block</option>
            <option value="flag">Flag</option>
          </select>
        ) : (
          <ActionBadge action={rule.action} />
        )}
      </td>
      <td className="px-3 py-3 text-right text-xs tabular-nums text-dashboard-heading">
        {fmtNumber(rule.hit_count)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-xs text-dashboard-muted">
        {rule.last_hit_at ? fmtDateTime(rule.last_hit_at) : "Never"}
      </td>
      <td className="px-3 py-3">
        {confirmingDelete ? (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <span className="text-[11px] text-dashboard-heading">Delete?</span>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              Delete
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              disabled={busy}
              className="rounded-md border border-dashboard-border/60 px-2 py-1 text-[11px] font-medium text-dashboard-heading hover:bg-dashboard-bg"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-dashboard-muted" />}
            <IconButton
              label="Edit"
              onClick={onEdit}
              disabled={!canUpdate || busy}
              icon={Pencil}
            />
            {rule.is_system && (
              <IconButton
                label={rule.is_modified ? "Reset to default" : "Already at default"}
                onClick={onReset}
                disabled={!canUpdate || busy || !rule.is_modified}
                icon={RotateCcw}
              />
            )}
            <IconButton
              label="Delete"
              onClick={onAskDelete}
              disabled={!canDelete || busy}
              icon={Trash2}
              danger
            />
          </div>
        )}
      </td>
    </tr>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  icon: Icon,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: typeof Pencil;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashboard-border/60 text-dashboard-muted transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          : "hover:bg-dashboard-bg hover:text-dashboard-heading"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
