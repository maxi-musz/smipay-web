"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  FlaskConical,
  Loader2,
  MailWarning,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import {
  GUARD_FIELDS,
  type ActivityFieldSummary,
  type GuardField,
  type GuardMode,
  type IdentityGuardConfigResponse,
} from "@/types/admin/identity-guards";
import {
  Banner,
  FIELD_META,
  MODE_META,
  ModeControl,
  errorMessage,
  fieldInfo,
  fmtDateTime,
  fmtNumber,
  isRuleRunning,
  modeOf,
  rulesFor,
  secondaryButtonClass,
  type GuardPerms,
} from "./shared";
import { SurfacesPanel } from "./SurfacesPanel";

export type IdentityGuardsTab =
  | "overview"
  | GuardField
  | "simulator"
  | "activity";

const joinLabels = (labels: string[]) =>
  labels.length <= 1
    ? (labels[0] ?? "")
    : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

export function OverviewTab({
  config,
  perms,
  summary,
  onConfigSaved,
  onReload,
  onOpenTab,
}: {
  config: IdentityGuardConfigResponse;
  perms: GuardPerms;
  summary: ActivityFieldSummary | null;
  onConfigSaved: (next: IdentityGuardConfigResponse) => void;
  onReload: () => Promise<void>;
  onOpenTab: (tab: IdentityGuardsTab) => void;
}) {
  const [pendingOff, setPendingOff] = useState<GuardField | null>(null);
  const [savingField, setSavingField] = useState<GuardField | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [surfaceBusy, setSurfaceBusy] = useState(false);
  // Shared with SurfacesPanel: every save returns the whole config, so only one may be in flight.
  const saveLock = useRef(false);
  const configBusy = savingField !== null || surfaceBusy;

  const canChangeMode = perms.canUpdate && !perms.locked;
  const monitored = GUARD_FIELDS.filter((f) => modeOf(config, f) === "monitor");
  const brokenCount = config.rules.filter((r) => r.problem).length;
  const brokenFields = GUARD_FIELDS.filter((f) =>
    config.rules.some((r) => r.field === f && r.problem),
  );
  const policy = config.notes?.disposable_policy;

  const saveMode = async (field: GuardField, next: GuardMode) => {
    if (saveLock.current) return;
    saveLock.current = true;
    setSavingField(field);
    setError(null);
    setNotice(null);
    try {
      onConfigSaved(await adminIdentityGuardsApi.updateModes({ [field]: next }));
      setNotice(
        `${fieldInfo(config.fields, field).label} is now ${MODE_META[next].label}.`,
      );
    } catch (e) {
      setError(errorMessage(e, "Could not change the mode"));
    } finally {
      saveLock.current = false;
      setSavingField(null);
      setPendingOff(null);
    }
  };

  const requestMode = (field: GuardField, next: GuardMode) => {
    if (next === "off") {
      setPendingOff(field);
      return;
    }
    setPendingOff(null);
    void saveMode(field, next);
  };

  const restoreDefaults = async () => {
    setRestoring(true);
    setError(null);
    setNotice(null);
    try {
      const res = await adminIdentityGuardsApi.restoreDefaults();
      await onReload();
      setNotice(
        res.created > 0
          ? `Added back ${res.created} default rule${res.created === 1 ? "" : "s"}. Your edits were kept.`
          : "Every default rule is already present — nothing to add.",
      );
    } catch (e) {
      setError(errorMessage(e, "Could not restore the default rules"));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-4">
      {brokenCount > 0 && (
        <Banner
          tone="warn"
          action={
            <div className="flex flex-wrap gap-1.5">
              {brokenFields.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onOpenTab(f)}
                  className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                >
                  {fieldInfo(config.fields, f).label}
                </button>
              ))}
            </div>
          }
        >
          <strong>
            {brokenCount === 1
              ? "1 rule isn't running"
              : `${brokenCount} rules aren't running`}
          </strong>{" "}
          — the guard skips a rule whose saved settings it can&apos;t read, even
          when it&apos;s switched on. Open the{" "}
          {joinLabels(brokenFields.map((f) => fieldInfo(config.fields, f).label))}{" "}
          tab{brokenFields.length === 1 ? "" : "s"} to see why, then edit or
          delete {brokenCount === 1 ? "it" : "them"}.
        </Banner>
      )}

      {monitored.length > 0 && (
        <Banner
          tone="info"
          icon={Eye}
          action={
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onOpenTab("activity")}
                className="rounded-md border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
              >
                Activity
              </button>
              <button
                type="button"
                onClick={() => onOpenTab("simulator")}
                className="rounded-md border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
              >
                Backtest
              </button>
            </div>
          }
        >
          <strong>
            {joinLabels(monitored.map((f) => fieldInfo(config.fields, f).label))}{" "}
            {monitored.length === 1 ? "is" : "are"} in Monitor
          </strong>{" "}
          — block rules only log “would block”. Review Activity and run a
          Backtest, then switch to Enforce.
        </Banner>
      )}

      {config.notes?.bvn_sandbox && (
        <Banner tone="info" icon={FlaskConical}>
          Dojah is in <strong>sandbox</strong>, so BVN rules are skipped on the
          Dojah sign-up and in-app BVN checks — sandbox test BVNs repeat digits
          and would trip them. The 11-digit floor still applies, and other BVN
          paths keep every rule.{" "}
          <Link href="/unified-admin/providers/kyc" className="font-semibold underline">
            KYC provider settings
          </Link>
        </Banner>
      )}

      {policy && (
        <Banner tone="neutral" icon={MailWarning}>
          After these rules, the original email checks still run (domain lists →
          disposable dataset → MX). Throwaway inboxes are currently{" "}
          <strong className="text-dashboard-heading">
            {policy.effective_blocking ? "blocked" : "only logged"}
          </strong>{" "}
          — security policy is in{" "}
          <span className="font-medium text-dashboard-heading">
            {policy.enforcement_mode === "enforce" ? "Enforce" : "Monitor"}
          </span>
          , “Block throwaway email inboxes” is{" "}
          <span className="font-medium text-dashboard-heading">
            {policy.block_disposable_email ? "on" : "off"}
          </span>
          .{" "}
          <Link
            href="/unified-admin/settings/security"
            className="font-semibold text-brand-bg-primary hover:underline"
          >
            Settings → Security
          </Link>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {GUARD_FIELDS.map((field) => {
          const info = fieldInfo(config.fields, field);
          const Icon = FIELD_META[field].icon;
          const mode = modeOf(config, field);
          const defaultMode = config.default_modes?.[field];
          const rules = rulesFor(config.rules, field);
          const enabled = rules.filter(isRuleRunning);
          const blockCount = enabled.filter((r) => r.action === "block").length;
          const flagCount = enabled.length - blockCount;
          const brokenHere = rules.filter((r) => r.problem).length;
          const hits = summary?.[field];

          return (
            <section
              key={field}
              className="flex flex-col rounded-xl border border-dashboard-border/60 bg-dashboard-surface"
            >
              <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg">
                    <Icon className="h-4 w-4 text-dashboard-heading" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-dashboard-heading">{info.label}</h2>
                    <p className="text-[11px] text-dashboard-muted">
                      {MODE_META[mode].help}
                      {defaultMode && defaultMode !== mode && (
                        <> Default: {MODE_META[defaultMode].label}.</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {savingField === field && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-dashboard-muted" />
                  )}
                  <ModeControl
                    value={mode}
                    defaultMode={defaultMode}
                    disabled={!canChangeMode || configBusy}
                    busy={savingField === field}
                    onChange={(next) => requestMode(field, next)}
                  />
                </div>
              </header>

              <div className="flex-1 space-y-3 px-4 py-3 sm:px-5">
                {info.description && (
                  <p className="text-xs leading-relaxed text-dashboard-muted">
                    {info.description}
                  </p>
                )}

                <p className="flex items-start gap-1.5 text-xs text-dashboard-heading">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>
                    <span className="font-semibold">Floor, always on:</span> {info.floor}
                  </span>
                </p>

                {pendingOff === field && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                    <p>
                      <strong>Turn {FIELD_META[field].noun} rules off?</strong>{" "}
                      Every rule below stops running and nothing is logged. The
                      floor still applies: {info.floor}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveMode(field, "off")}
                        disabled={configBusy}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {savingField === field && <Loader2 className="h-3 w-3 animate-spin" />}
                        Turn off
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingOff(null)}
                        disabled={savingField === field}
                        className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-dashboard-bg px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-dashboard-muted">
                      Rules on
                    </p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-dashboard-heading">
                      {enabled.length}
                      <span className="text-xs font-medium text-dashboard-muted">
                        {" "}
                        / {rules.length}
                      </span>
                    </p>
                    <p className="text-[11px] text-dashboard-muted">
                      <span className="text-red-700">{blockCount} block</span> ·{" "}
                      <span className="text-amber-700">{flagCount} flag</span>
                    </p>
                    {brokenHere > 0 && (
                      <p className="text-[11px] font-semibold text-red-700">
                        {brokenHere} not running
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-dashboard-bg px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-dashboard-muted">
                      Last 7 days
                    </p>
                    {hits ? (
                      <div className="mt-0.5 space-y-px text-[11px]">
                        <p className="flex justify-between gap-2">
                          <span className="text-dashboard-muted">Blocked</span>
                          <span className="font-semibold tabular-nums text-red-700">
                            {fmtNumber(hits.block)}
                          </span>
                        </p>
                        <p className="flex justify-between gap-2">
                          <span className="text-dashboard-muted">Would block</span>
                          <span className="font-semibold tabular-nums text-violet-700">
                            {fmtNumber(hits.would_block)}
                          </span>
                        </p>
                        <p className="flex justify-between gap-2">
                          <span className="text-dashboard-muted">Flagged</span>
                          <span className="font-semibold tabular-nums text-amber-700">
                            {fmtNumber(hits.flag)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-dashboard-muted">Not available</p>
                    )}
                  </div>
                </div>
              </div>

              <footer className="border-t border-dashboard-border/40 px-4 py-2.5 sm:px-5">
                <button
                  type="button"
                  onClick={() => onOpenTab(field)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-bg-primary hover:underline"
                >
                  Manage {FIELD_META[field].noun} rules
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </footer>
            </section>
          );
        })}
      </div>

      <SurfacesPanel
        config={config}
        perms={perms}
        onConfigSaved={onConfigSaved}
        saveLock={saveLock}
        busyElsewhere={savingField !== null}
        onBusyChange={setSurfaceBusy}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dashboard-heading">Default rules</p>
          <p className="text-xs text-dashboard-muted">
            Adds back any shipped rule that was deleted. Rules you edited or
            added are left exactly as they are.
            {config.seeded_at && (
              <> Defaults synced through {fmtDateTime(config.seeded_at)}.</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={restoreDefaults}
          disabled={!perms.canWrite || perms.locked || restoring}
          className={secondaryButtonClass}
        >
          {restoring ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Undo2 className="h-3.5 w-3.5" />
          )}
          Restore defaults
        </button>
      </div>
    </div>
  );
}
