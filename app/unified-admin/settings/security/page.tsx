"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Lock,
  Gauge,
  SlidersHorizontal,
  RefreshCw,
  Loader2,
  Eye,
  RotateCcw,
  Check,
  AlertTriangle,
} from "lucide-react";
import { adminSecurityApi } from "@/services/admin/security-api";
import { adminMaintenanceApi } from "@/services/admin/maintenance-api";
import type {
  SecurityPolicy,
  SecurityPolicyField,
  SecurityPolicyGroup,
} from "@/types/admin/security";
import type {
  MaintenanceFlag,
  MaintenancePhase,
  MaintenanceScope,
} from "@/types/admin/maintenance";
import { adminRateLimitsApi } from "@/services/admin/rate-limits-api";
import type {
  RateLimitBounds,
  RateLimitGroup,
} from "@/types/admin/rate-limits";
import {
  resolveSections,
  type ResolvedSection,
  type ResolvedTab,
} from "./_layout";
import {
  RateLimitsPanel,
  ruleEqual,
  toRuleState,
  type RuleState,
} from "./_RateLimitsPanel";
import { MessagesSection } from "./_MessagesPanel";
import { MonitorLogPanel } from "./_MonitorLogPanel";
import { BlockedIpsPanel } from "./_BlockedIpsPanel";
import type { UserMessageItem } from "@/types/admin/messages";

const ICONS: Record<string, typeof ShieldCheck> = {
  UserPlus,
  KeyRound,
  Lock,
  Gauge,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
};

type Value = string | number | boolean | null;

/** Editable slice of a maintenance flag. Dates are `datetime-local` strings. */
interface AreaState {
  is_active: boolean;
  scope: MaintenanceScope;
  message: string;
  starts_at: string;
  ends_at: string;
}
type AreaMap = Record<string, AreaState>;

/** ISO (UTC) → the `YYYY-MM-DDTHH:mm` local value the input expects. */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const localInputToIso = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

const toAreaMap = (flags: MaintenanceFlag[]): AreaMap =>
  Object.fromEntries(
    flags.map((f) => [
      f.area,
      {
        is_active: f.is_active,
        scope: f.scope,
        message: f.message ?? "",
        starts_at: isoToLocalInput(f.starts_at),
        ends_at: isoToLocalInput(f.ends_at),
      },
    ]),
  );

const areaEqual = (a: AreaState | undefined, b: AreaState | undefined) =>
  !!a &&
  !!b &&
  a.is_active === b.is_active &&
  a.scope === b.scope &&
  a.message === b.message &&
  a.starts_at === b.starts_at &&
  a.ends_at === b.ends_at;

/**
 * What users are experiencing right now, computed from the draft so the badge
 * reacts as you edit rather than lagging until save. Mirrors `phaseFor` on the
 * backend — that remains the authority.
 */
function phaseOf(state: AreaState, now = Date.now()): MaintenancePhase {
  if (!state.is_active) return "live";
  const start = state.starts_at ? new Date(state.starts_at).getTime() : null;
  const end = state.ends_at ? new Date(state.ends_at).getTime() : null;
  if (start && now < start) return "scheduled";
  if (end && now >= end) return "expired";
  return "blocking";
}

const PHASE_BADGE: Record<
  MaintenancePhase,
  { label: string; className: string }
> = {
  live: { label: "Live", className: "bg-emerald-50 text-emerald-600" },
  blocking: { label: "Offline", className: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
  expired: { label: "Window passed", className: "bg-gray-100 text-gray-600" },
};

export default function SecuritySettingsPage() {
  const [groups, setGroups] = useState<SecurityPolicyGroup[]>([]);
  const [flags, setFlags] = useState<MaintenanceFlag[]>([]);
  const [defaults, setDefaults] = useState<SecurityPolicy>({});

  const [policySaved, setPolicySaved] = useState<SecurityPolicy | null>(null);
  const [policyDraft, setPolicyDraft] = useState<SecurityPolicy>({});
  const [areaSaved, setAreaSaved] = useState<AreaMap>({});
  const [areaDraft, setAreaDraft] = useState<AreaMap>({});

  const [rlGroups, setRlGroups] = useState<RateLimitGroup[]>([]);
  const [rlBounds, setRlBounds] = useState<RateLimitBounds | null>(null);
  const [rlSaved, setRlSaved] = useState<Record<string, RuleState>>({});
  const [rlDraft, setRlDraft] = useState<Record<string, RuleState>>({});
  /** Rules queued to have their override deleted on save. */
  const [rlResets, setRlResets] = useState<Set<string>>(new Set());

  const [msgItems, setMsgItems] = useState<UserMessageItem[]>([]);
  const [msgMaxLength, setMsgMaxLength] = useState(400);
  const [msgSaved, setMsgSaved] = useState<Record<string, string>>({});
  const [msgDraft, setMsgDraft] = useState<Record<string, string>>({});

  const [sectionKey, setSectionKey] = useState<string | null>(null);
  const [tabKey, setTabKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Settled, not all: these are two independent backends. If one is down or
    // its migration hasn't run yet, the other half of the page must still work
    // — an admin needs the availability switches most when something is broken.
    const [policyRes, maintRes, rlRes, msgRes] = await Promise.allSettled([
      adminSecurityApi.getPolicy(),
      adminMaintenanceApi.list(),
      adminRateLimitsApi.list(),
      adminSecurityApi.listMessages(),
    ]);

    if (policyRes.status === "fulfilled") {
      setGroups(policyRes.value.data.groups);
      setDefaults(policyRes.value.data.defaults);
      setPolicySaved(policyRes.value.data.policy);
      setPolicyDraft(policyRes.value.data.policy);
    } else {
      setGroups([]);
      setPolicySaved(null);
    }

    if (maintRes.status === "fulfilled") {
      setFlags(maintRes.value.data.items);
      const areas = toAreaMap(maintRes.value.data.items);
      setAreaSaved(areas);
      setAreaDraft(areas);
    } else {
      setFlags([]);
    }

    if (rlRes.status === "fulfilled") {
      setRlGroups(rlRes.value.data.groups);
      setRlBounds(rlRes.value.data.bounds);
      const states = Object.fromEntries(
        rlRes.value.data.groups.flatMap((g) =>
          g.rules.map((r) => [r.key, toRuleState(r)]),
        ),
      );
      setRlSaved(states);
      setRlDraft(states);
      setRlResets(new Set());
    } else {
      setRlGroups([]);
    }

    if (msgRes.status === "fulfilled") {
      const { items, rate_limit_overrides, max_length } = msgRes.value.data;
      setMsgItems(items);
      setMsgMaxLength(max_length);
      // Per-endpoint rate-limit overrides share the message key space; an empty
      // string means "no override, use the shared default".
      const states: Record<string, string> = Object.fromEntries(
        items.map((i) => [i.key, i.message]),
      );
      for (const o of rate_limit_overrides) states[o.key] = o.message;
      setMsgSaved(states);
      setMsgDraft(states);
    } else {
      setMsgItems([]);
    }

    const failed = [
      { ok: policyRes.status === "fulfilled", name: "security rules", res: policyRes },
      { ok: maintRes.status === "fulfilled", name: "availability", res: maintRes },
      { ok: rlRes.status === "fulfilled", name: "rate limits", res: rlRes },
      { ok: msgRes.status === "fulfilled", name: "messages", res: msgRes },
    ].filter((f) => !f.ok);

    setError(
      failed.length === 0
        ? null
        : `Could not load ${failed.map((f) => f.name).join(", ")}: ${
            ((failed[0].res as PromiseRejectedResult).reason as Error)
              ?.message ?? "unknown error"
          }`,
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(
    () => resolveSections(groups, flags, rlGroups),
    [groups, flags, rlGroups],
  );

  // Keep the selected section/tab valid across reloads and data changes.
  useEffect(() => {
    if (sections.length === 0) return;
    const section =
      sections.find((s) => s.key === sectionKey) ?? sections[0];
    if (section.key !== sectionKey) setSectionKey(section.key);
    if (!section.tabs.some((t) => t.key === tabKey)) {
      setTabKey(section.tabs[0]?.key ?? null);
    }
  }, [sections, sectionKey, tabKey]);

  const changedPolicyKeys = useMemo(() => {
    if (!policySaved) return [];
    return Object.keys(policyDraft).filter(
      (k) => policyDraft[k] !== policySaved[k],
    );
  }, [policyDraft, policySaved]);

  const changedAreas = useMemo(
    () =>
      Object.keys(areaDraft).filter(
        (a) => !areaEqual(areaDraft[a], areaSaved[a]),
      ),
    [areaDraft, areaSaved],
  );

  const changedRules = useMemo(
    () =>
      Object.keys(rlDraft).filter(
        (k) => rlResets.has(k) || !ruleEqual(rlDraft[k], rlSaved[k]),
      ),
    [rlDraft, rlSaved, rlResets],
  );

  const changedMessages = useMemo(
    () => Object.keys(msgDraft).filter((k) => msgDraft[k] !== msgSaved[k]),
    [msgDraft, msgSaved],
  );

  const totalChanges =
    changedPolicyKeys.length +
    changedAreas.length +
    changedRules.length +
    changedMessages.length;
  const dirty = totalChanges > 0;

  /** Messages belonging to one policy group / the rate-limit section. */
  const messagesFor = useCallback(
    (group: string) => msgItems.filter((m) => m.group === group),
    [msgItems],
  );

  /** Unsaved-edit count for one tab, so hidden edits stay visible. */
  const countTab = useCallback(
    (tab: ResolvedTab) => {
      if (tab.kind === "policy") {
        const fields = tab.group.fields.filter((f) =>
          changedPolicyKeys.includes(f.key),
        ).length;
        // The tab also hosts the messages for its group.
        const msgs = msgItems.filter(
          (m) => m.group === tab.group.key && changedMessages.includes(m.key),
        ).length;
        return fields + msgs;
      }
      if (tab.kind === "availability") {
        return tab.areas.filter((a) => changedAreas.includes(a.area)).length;
      }
      if (tab.kind === "ratelimits") {
        const rules = tab.group.rules.filter((r) =>
          changedRules.includes(r.key),
        ).length;
        // Per-endpoint message overrides live on these cards too.
        const msgs = changedMessages.filter(
          (k) =>
            k === "rate_limit.default" ||
            tab.group.rules.some(
              (r) => k === `rate_limit.rule.${r.key}`,
            ),
        ).length;
        return rules + msgs;
      }
      return 0; // monitor is read-only
    },
    [changedPolicyKeys, changedAreas, changedRules, changedMessages, msgItems],
  );

  const countSection = useCallback(
    (section: ResolvedSection) =>
      section.tabs.reduce((sum, t) => sum + countTab(t), 0),
    [countTab],
  );

  const setField = (key: string, value: Value) =>
    setPolicyDraft((prev) => ({ ...prev, [key]: value }));

  const setArea = (area: string, patch: Partial<AreaState>) =>
    setAreaDraft((prev) => ({ ...prev, [area]: { ...prev[area], ...patch } }));

  const setRule = (key: string, patch: Partial<RuleState>) => {
    setRlDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    // Editing a rule cancels a queued reset — the two are contradictory.
    setRlResets((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  /** Queue (or unqueue) dropping this rule's override on save. */
  const toggleRuleReset = (key: string) => {
    setRlResets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Show the code defaults immediately so the card reflects the outcome.
        const meta = rlGroups
          .flatMap((g) => g.rules)
          .find((r) => r.key === key);
        if (meta) {
          setRlDraft((d) => ({
            ...d,
            [key]: { enabled: true, ...meta.defaults },
          }));
        }
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (changedPolicyKeys.length > 0) {
        const patch = Object.fromEntries(
          changedPolicyKeys.map((k) => [k, policyDraft[k]]),
        );
        const res = await adminSecurityApi.updatePolicy(patch);
        setPolicySaved(res.data.policy);
        setPolicyDraft(res.data.policy);
      }

      // Sequential so a mid-way failure leaves a clear, partially-applied
      // state rather than an unknown one; already-saved areas stay saved.
      for (const area of changedAreas) {
        const next = areaDraft[area];
        await adminMaintenanceApi.update({
          area,
          is_active: next.is_active,
          scope: next.scope,
          message: next.message,
          starts_at: localInputToIso(next.starts_at),
          ends_at: localInputToIso(next.ends_at),
        });
        setAreaSaved((prev) => ({ ...prev, [area]: { ...next } }));
      }

      for (const key of changedRules) {
        if (rlResets.has(key)) {
          // Delete the override entirely so the decorator's values apply again.
          await adminRateLimitsApi.reset(key);
        } else {
          const r = rlDraft[key];
          await adminRateLimitsApi.update({
            key,
            enabled: r.enabled,
            ip_limit: r.ip_limit,
            device_limit: r.device_limit,
            phone_limit: r.phone_limit,
            window_seconds: r.window_seconds,
          });
        }
      }
      for (const key of changedMessages) {
        await adminSecurityApi.setMessage(key, msgDraft[key] ?? "");
        setMsgSaved((prev) => ({ ...prev, [key]: msgDraft[key] ?? "" }));
      }

      // Overrides changed shape (rows created/deleted), so re-read the truth.
      if (changedRules.length > 0) {
        const fresh = await adminRateLimitsApi.list();
        setRlGroups(fresh.data.groups);
        const states = Object.fromEntries(
          fresh.data.groups.flatMap((g) =>
            g.rules.map((r) => [r.key, toRuleState(r)]),
          ),
        );
        setRlSaved(states);
        setRlDraft(states);
        setRlResets(new Set());
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (policySaved) setPolicyDraft(policySaved);
    setAreaDraft(areaSaved);
    setRlDraft(rlSaved);
    setRlResets(new Set());
    setMsgDraft(msgSaved);
  };

  const setMessage = (key: string, value: string) =>
    setMsgDraft((prev) => ({ ...prev, [key]: value }));

  const enforcing = policyDraft.enforcement_mode === "enforce";
  // Only count what is actually blocking users — a scheduled-but-not-yet-open
  // window shouldn't raise the alarm.
  const activeAreaCount = Object.values(areaDraft).filter(
    (a) => phaseOf(a) === "blocking",
  ).length;

  const section = sections.find((s) => s.key === sectionKey) ?? null;
  const tab = section?.tabs.find((t) => t.key === tabKey) ?? null;

  return (
    <div className="min-h-screen bg-dashboard-bg pb-24">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5 pb-3 sm:px-6 sm:pt-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-dashboard-heading">
                Security
              </h1>
              <p className="text-xs text-dashboard-muted">
                Rules and availability for every protected flow — no rebuild
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeAreaCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border bg-amber-50 border-amber-200 text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {activeAreaCount} area{activeAreaCount === 1 ? "" : "s"} offline
              </span>
            )}
            {policySaved && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                  enforcing
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                }`}
              >
                {enforcing ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {enforcing ? "Enforcing" : "Monitor only"}
              </span>
            )}
            <button
              type="button"
              onClick={load}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Row 1 — which part of the app */}
        {sections.length > 0 && (
          <nav className="px-4 sm:px-6 lg:px-8 -mb-px overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 min-w-max">
              {sections.map((s) => {
                const Icon = ICONS[s.icon] ?? ShieldCheck;
                const active = s.key === sectionKey;
                const count = countSection(s);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setSectionKey(s.key);
                      setTabKey(s.tabs[0]?.key ?? null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      active
                        ? "border-brand-bg-primary text-dashboard-heading"
                        : "border-transparent text-dashboard-muted hover:text-dashboard-heading"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                    {count > 0 && <ChangeDot count={count} />}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Row 2 — what about it. Hidden when the section has a single tab. */}
      {section && section.tabs.length > 1 && (
        <div className="bg-dashboard-surface/60 border-b border-dashboard-border/40 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 py-2 min-w-max">
            {section.tabs.map((t) => {
              const active = t.key === tabKey;
              const count = countTab(t);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTabKey(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? "bg-brand-bg-primary text-white"
                      : "text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg"
                  }`}
                >
                  {t.label}
                  {count > 0 && <ChangeDot count={count} inverted={active} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={load}
              className="ml-2 underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !policySaved ? (
          <div className="h-64 rounded-xl border border-dashboard-border/60 bg-dashboard-surface animate-pulse" />
        ) : tab?.kind === "policy" ? (
          <>
            <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5">
              <div className="pb-3 mb-1 border-b border-dashboard-border/40">
                <p className="text-sm font-semibold text-dashboard-heading">
                  {tab.group.label}
                </p>
                <p className="text-xs text-dashboard-muted mt-0.5">
                  {tab.group.description}
                </p>
              </div>
              {tab.group.key === "login" ? (
                <AdminLoginOtpStatusBanner draft={policyDraft} />
              ) : null}
              <div className="divide-y divide-dashboard-border/40">
                {tab.group.fields
                  .filter((f) => {
                    if (!f.depends_on) return true;
                    const current = policyDraft[f.depends_on.key];
                    if (current === null || current === undefined) return false;
                    return f.depends_on.equals.includes(current);
                  })
                  .map((field) => (
                    <FieldRow
                      key={field.key}
                      field={field}
                      value={policyDraft[field.key]}
                      defaultValue={defaults[field.key]}
                      savedValue={policySaved?.[field.key]}
                      onChange={setField}
                    />
                  ))}
              </div>
            </div>
            <MessagesSection
              items={messagesFor(tab.group.key)}
              draft={msgDraft}
              saved={msgSaved}
              maxLength={msgMaxLength}
              onChange={setMessage}
            />
          </>
        ) : tab?.kind === "monitor" ? (
          <MonitorLogPanel enforcing={enforcing} />
        ) : tab?.kind === "blocked-ips" ? (
          <BlockedIpsPanel />
        ) : tab?.kind === "ratelimits" ? (
          <>
            <MessagesSection
              items={messagesFor("rate_limit")}
              draft={msgDraft}
              saved={msgSaved}
              maxLength={msgMaxLength}
              onChange={setMessage}
              title="Message shown when someone is going too fast"
              intro="One message covers every rate limit in the app. Individual endpoints below can override it, but most never need to."
            />
            <RateLimitsPanel
              group={tab.group}
              draft={rlDraft}
              saved={rlSaved}
              pendingResets={rlResets}
              bounds={rlBounds}
              messageDraft={msgDraft}
              messageSaved={msgSaved}
              messageMaxLength={msgMaxLength}
              onChange={setRule}
              onToggleReset={toggleRuleReset}
              onMessageChange={setMessage}
            />
          </>
        ) : tab?.kind === "availability" ? (
          <>
            <p className="text-xs text-dashboard-muted px-0.5">
              Each switch is the flow itself:{" "}
              <span className="font-semibold text-emerald-600">on</span> means
              users can use it,{" "}
              <span className="font-semibold text-amber-600">off</span> means
              they get a maintenance message instead — nothing is generated,
              sent or charged while it is off.
            </p>
            {tab.areas.map((meta) => (
              <AreaCard
                key={meta.area}
                meta={meta}
                state={areaDraft[meta.area]}
                savedState={areaSaved[meta.area]}
                onChange={setArea}
              />
            ))}
          </>
        ) : null}
      </div>

      {dirty && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-dashboard-surface border-t border-dashboard-border/60 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            <p className="text-xs text-dashboard-muted">
              <span className="font-semibold text-dashboard-heading">
                {totalChanges}
              </span>{" "}
              unsaved change{totalChanges === 1 ? "" : "s"}
              {section && countSection(section) !== totalChanges && (
                <span className="ml-1">across tabs</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discard}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Discard
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {justSaved && !dirty && (
        <div className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg">
          <Check className="h-4 w-4" />
          Security settings saved
        </div>
      )}
    </div>
  );
}

function ChangeDot({
  count,
  inverted = false,
}: {
  count: number;
  inverted?: boolean;
}) {
  return (
    <span
      className={`ml-0.5 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
        inverted ? "bg-white text-brand-bg-primary" : "bg-amber-500 text-white"
      }`}
    >
      {count}
    </span>
  );
}

function AreaCard({
  meta,
  state,
  savedState,
  onChange,
}: {
  meta: MaintenanceFlag;
  state: AreaState | undefined;
  savedState: AreaState | undefined;
  onChange: (area: string, patch: Partial<AreaState>) => void;
}) {
  if (!state) return null;
  const changed = !areaEqual(state, savedState);
  const phase = phaseOf(state);
  const badge = PHASE_BADGE[phase];
  const scheduled = Boolean(state.starts_at || state.ends_at);
  const windowInvalid =
    Boolean(state.starts_at && state.ends_at) &&
    new Date(state.ends_at) <= new Date(state.starts_at);

  return (
    <div
      className={`rounded-xl border bg-dashboard-surface p-4 sm:p-5 space-y-4 transition-colors ${
        phase === "blocking"
          ? "border-amber-300"
          : phase === "scheduled"
            ? "border-blue-200"
            : "border-dashboard-border/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-dashboard-heading">
              {meta.label}
            </p>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.className}`}
            >
              {badge.label}
            </span>
            {changed && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                Changed
              </span>
            )}
          </div>
          <p className="text-xs text-dashboard-muted mt-1 leading-relaxed">
            {meta.description}
          </p>
        </div>
        {/* Reads as "is this service live?" — on/green = available. The stored
            flag is the inverse (is_active = under maintenance), so it's
            negated here rather than showing operators a backwards switch. */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Toggle
            on={!state.is_active}
            onClick={() => onChange(meta.area, { is_active: !state.is_active })}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              state.is_active ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {state.is_active ? "Off" : "On"}
          </span>
        </div>
      </div>

      {state.is_active && (
        <div className="space-y-3 pt-3 border-t border-dashboard-border/40">
          <div className="flex items-center gap-3">
            <label className="text-xs text-dashboard-heading flex-1">
              Who it blocks
            </label>
            <select
              value={state.scope}
              onChange={(e) =>
                onChange(meta.area, {
                  scope: e.target.value as MaintenanceScope,
                })
              }
              className="text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="users">Users only (admins still pass)</option>
              <option value="all">Everyone (including admins)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs text-dashboard-heading">
                  Schedule a window
                </label>
                <p className="text-[11px] text-dashboard-muted mt-0.5">
                  Leave empty to go offline now and stay off until you switch it
                  back on.
                </p>
              </div>
              {scheduled && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(meta.area, { starts_at: "", ends_at: "" })
                  }
                  className="text-[11px] text-dashboard-muted hover:text-dashboard-heading underline shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-dashboard-muted">
                  Goes offline
                </label>
                <input
                  type="datetime-local"
                  value={state.starts_at}
                  onChange={(e) =>
                    onChange(meta.area, { starts_at: e.target.value })
                  }
                  className="w-full text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-dashboard-muted">
                  Comes back
                </label>
                <input
                  type="datetime-local"
                  value={state.ends_at}
                  onChange={(e) =>
                    onChange(meta.area, { ends_at: e.target.value })
                  }
                  className={`w-full text-sm border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 ${
                    windowInvalid
                      ? "border-red-300 focus:ring-red-200"
                      : "border-dashboard-border/60 focus:ring-orange-200"
                  }`}
                />
              </div>
            </div>
            {windowInvalid ? (
              <p className="text-[11px] text-red-600">
                The end time must be after the start time.
              </p>
            ) : (
              <p className="text-[11px] text-dashboard-muted">
                {describeWindow(state, phase)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-dashboard-heading">
              Message shown to users (optional)
            </label>
            <textarea
              rows={2}
              value={state.message}
              placeholder={meta.default_message}
              onChange={(e) => onChange(meta.area, { message: e.target.value })}
              className="w-full text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const fmt = (v: string) =>
  new Date(v).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

/** Plain-English summary of what the current window means. */
function describeWindow(state: AreaState, phase: MaintenancePhase): string {
  const { starts_at: s, ends_at: e } = state;
  if (!s && !e) return "Offline now, until you switch it back on.";
  if (phase === "expired")
    return `The window closed ${fmt(e)} — this is not blocking anyone. Clear the dates or set new ones.`;
  if (s && e) return `Offline from ${fmt(s)} until ${fmt(e)}, then back automatically.`;
  if (s) return `Goes offline ${fmt(s)} and stays off until you switch it back on.`;
  return `Offline now, back automatically at ${fmt(e)}.`;
}

/** Live effective state for admin-login OTP, including temporary overrides. */
function AdminLoginOtpStatusBanner({ draft }: { draft: SecurityPolicy }) {
  const baseline = draft.admin_login_requires_otp !== false;
  const untilRaw = draft.admin_login_otp_override_until;
  const until =
    typeof untilRaw === "string" && untilRaw ? new Date(untilRaw) : null;
  const overrideActive =
    !!until && !Number.isNaN(until.getTime()) && until.getTime() > Date.now();
  const effective = overrideActive ? !baseline : baseline;

  const tone = effective
    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
    : "bg-amber-50 border-amber-200 text-amber-900";

  let detail: string;
  if (overrideActive && until) {
    detail = effective
      ? `Temporary override: OTP is required until ${until.toLocaleString()}, then the baseline (${baseline ? "required" : "not required"}) returns.`
      : `Temporary override: password-only admin login is allowed until ${until.toLocaleString()}, then OTP returns automatically.`;
  } else if (until && !Number.isNaN(until.getTime()) && until.getTime() <= Date.now()) {
    detail =
      "The override deadline has passed. Clear it, or set a new one. Baseline toggle applies now.";
  } else {
    detail = effective
      ? "Staff must verify an email OTP after their password on the web console."
      : "Staff can sign in with password only on the web console. Re-enable OTP when the window of need ends.";
  }

  return (
    <div className={`mt-3 mb-1 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${tone}`}>
      <span className="font-semibold">
        Effective now: {effective ? "OTP required" : "OTP not required"}
      </span>
      <span className="mx-1.5 text-current/50">·</span>
      <span>{detail}</span>
    </div>
  );
}

function FieldRow({
  field,
  value,
  defaultValue,
  savedValue,
  onChange,
}: {
  field: SecurityPolicyField;
  value: Value | undefined;
  defaultValue: Value | undefined;
  savedValue: Value | undefined;
  onChange: (key: string, value: Value) => void;
}) {
  const changed = savedValue !== undefined && value !== savedValue;
  const isDefault = value === defaultValue;

  return (
    <div className="py-3.5 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="text-sm font-medium text-dashboard-heading">
            {field.label}
          </label>
          {field.channel && <ChannelBadge channel={field.channel} />}
          {changed && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              Changed
            </span>
          )}
        </div>
        <p className="text-xs text-dashboard-muted mt-1 leading-relaxed">
          {field.help}
        </p>
        {!isDefault && defaultValue !== undefined && (
          <button
            type="button"
            onClick={() => onChange(field.key, defaultValue)}
            className="text-[11px] text-dashboard-muted hover:text-dashboard-heading underline mt-1.5 transition-colors"
          >
            Reset to default ({renderValue(defaultValue, field)})
          </button>
        )}
      </div>

      <div className="shrink-0 pt-0.5">
        {field.type === "boolean" && (
          <Toggle
            on={value === true}
            onClick={() => onChange(field.key, !(value === true))}
          />
        )}

        {field.type === "number" && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={typeof value === "number" ? value : ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  onChange(field.key, Number.isFinite(n) ? n : 0);
                }}
                className="w-20 text-sm text-right border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {field.unit && (
                <span className="text-xs text-dashboard-muted min-w-[4.5rem]">
                  {field.unit}
                </span>
              )}
            </div>
            {field.unit === "seconds" && typeof value === "number" && value > 0 && (
              <span className="text-[11px] text-dashboard-muted tabular-nums">
                {formatSecondsFriendly(value)}
              </span>
            )}
            {field.zero_label && value === 0 && (
              <span className="text-[11px] text-dashboard-muted italic">
                {field.zero_label}
              </span>
            )}
          </div>
        )}

        {field.type === "enum" && (
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {(field.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {field.type === "datetime" && (
          <div className="flex flex-col items-end gap-1.5">
            <input
              type="datetime-local"
              value={
                typeof value === "string" ? isoToLocalInput(value) : ""
              }
              onChange={(e) =>
                onChange(field.key, localInputToIso(e.target.value))
              }
              className="text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            {field.nullable && value ? (
              <button
                type="button"
                onClick={() => onChange(field.key, null)}
                className="text-[11px] text-dashboard-muted hover:text-dashboard-heading underline"
              >
                Clear deadline
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function renderValue(value: Value, field: SecurityPolicyField): string {
  if (value === null || value === undefined || value === "") {
    return field.type === "datetime" ? "none" : "—";
  }
  if (typeof value === "boolean") return value ? "on" : "off";
  if (typeof value === "number") {
    if (value === 0 && field.zero_label) return field.zero_label.toLowerCase();
    if (field.unit === "seconds" && value > 0) {
      return `${value} seconds (${formatSecondsFriendly(value).replace(/^=\s*/, "")})`;
    }
    return field.unit ? `${value} ${field.unit}` : String(value);
  }
  if (field.type === "datetime" && typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  return field.options?.find((o) => o.value === value)?.label ?? String(value);
}

function ChannelBadge({ channel }: { channel: "sms" | "email" | "both" }) {
  const label =
    channel === "sms" ? "SMS" : channel === "email" ? "Email" : "SMS + Email";
  const className =
    channel === "sms"
      ? "bg-sky-100 text-sky-800"
      : channel === "email"
        ? "bg-violet-100 text-violet-800"
        : "bg-emerald-100 text-emerald-800";
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${className}`}
    >
      {label}
    </span>
  );
}

/** e.g. 90 → "= 1m 30s", 120 → "= 2 minutes" */
function formatSecondsFriendly(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 60) return `= ${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return mins === 1 ? "= 1 minute" : `= ${mins} minutes`;
  }
  return `= ${mins}m ${secs}s`;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
