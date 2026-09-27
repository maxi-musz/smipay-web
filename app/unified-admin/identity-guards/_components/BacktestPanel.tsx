"use client";

import { Fragment, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  History,
  Loader2,
  Play,
  ShieldPlus,
} from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import {
  BACKTEST_SAMPLE_DEFAULT,
  BACKTEST_SAMPLE_MAX,
  BACKTEST_SAMPLE_MIN,
  GUARD_FIELDS,
  type BacktestResponse,
  type BacktestRuleResult,
  type GuardField,
  type GuardFieldInfo,
  type MxTier,
} from "@/types/admin/identity-guards";
import {
  ActionBadge,
  Banner,
  MODE_META,
  errorMessage,
  fieldClass,
  fieldInfo,
  fmtNumber,
  pct,
  primaryButtonClass,
  type GuardPerms,
} from "./shared";

const MX_TIER_LABEL: Record<MxTier, { label: string; className: string }> = {
  trusted: { label: "Trusted provider", className: "bg-emerald-50 text-emerald-700" },
  suffix: { label: "Allowed suffix", className: "bg-emerald-50 text-emerald-700" },
  A: { label: "Paid mail host", className: "bg-emerald-50 text-emerald-700" },
  none: { label: "Unknown host", className: "bg-slate-100 text-slate-600" },
  inconclusive: { label: "DNS inconclusive", className: "bg-amber-50 text-amber-700" },
  not_checked: { label: "Not checked", className: "bg-slate-100 text-slate-500" },
};

export function BacktestResults({
  result,
  fields,
  highlightKeys,
  perms,
  compact = false,
}: {
  result: BacktestResponse;
  fields?: GuardFieldInfo[];
  highlightKeys?: (key: string) => boolean;
  perms?: GuardPerms;
  compact?: boolean;
}) {
  const [openRule, setOpenRule] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<Record<string, "saving" | "done">>({});
  const [allowError, setAllowError] = useState<string | null>(null);

  const label = fieldInfo(fields, result.field).label;
  const scanned = result.scanned;
  const canAllow = !!perms && perms.canWrite && !perms.locked;
  const domains = result.insights?.email_domains_blocked ?? [];
  const prefixes = [...(result.insights?.bvn_prefixes ?? [])].sort(
    (a, b) => b.count - a.count,
  );
  const prefixTotal = prefixes.reduce((s, p) => s + p.count, 0);
  const prefixMax = prefixes[0]?.count ?? 0;

  const allowDomain = async (domain: string, verified: number) => {
    setAllowError(null);
    setAllowed((prev) => ({ ...prev, [domain]: "saving" }));
    try {
      await adminIdentityGuardsApi.createEmailDomainRule({
        pattern: domain,
        kind: "DOMAIN",
        action: "ALLOW",
        note: `Allowed from Backtest (${verified} BVN-verified user${verified === 1 ? "" : "s"})`,
      });
      setAllowed((prev) => ({ ...prev, [domain]: "done" }));
    } catch (e) {
      setAllowed((prev) => {
        const next = { ...prev };
        delete next[domain];
        return next;
      });
      setAllowError(errorMessage(e, `Could not allow ${domain}`));
    }
  };

  const blockNote =
    result.mode === "enforce"
      ? "stopped under the current mode"
      : `would be stopped under Enforce (${label} is ${MODE_META[result.mode]?.label ?? result.mode})`;

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
        <Tile
          label="Scanned"
          value={fmtNumber(scanned)}
          sub={`newest customers · ${(result.duration_ms / 1000).toFixed(1)}s`}
        />
        <Tile
          label="Blocked"
          value={fmtNumber(result.totals.block)}
          sub={`${pct(result.totals.block, scanned)} · ${blockNote}`}
          tone="red"
          verified={result.totals.block_bvn_verified}
        />
        <Tile
          label="Flagged"
          value={fmtNumber(result.totals.flag)}
          sub={`${pct(result.totals.flag, scanned)} · logged, not stopped`}
          tone="amber"
          verified={result.totals.flag_bvn_verified}
        />
        <Tile
          label="Pass"
          value={fmtNumber(result.totals.pass)}
          sub={pct(result.totals.pass, scanned)}
          tone="emerald"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-dashboard-border/60 bg-dashboard-bg">
              <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-2.5 font-medium">Rule</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 text-right font-medium">Hits</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  BVN-verified hits
                </th>
                <th className="w-8 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border/40">
              {result.rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-dashboard-muted">
                    No rules ran for this field.
                  </td>
                </tr>
              ) : (
                result.rules.map((rule) => (
                  <RuleRow
                    key={rule.key}
                    rule={rule}
                    scanned={scanned}
                    highlighted={highlightKeys?.(rule.key) ?? false}
                    open={openRule === rule.key}
                    onToggle={() =>
                      setOpenRule((k) => (k === rule.key ? null : rule.key))
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {domains.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
          <div className="border-b border-dashboard-border/40 px-4 py-3">
            <p className="text-sm font-semibold text-dashboard-heading">
              Email domains the allowlist would block
            </p>
            <p className="mt-0.5 text-xs text-dashboard-muted">
              A domain with BVN-verified users is almost certainly a real
              school or company. Allow it so the allowlist and domain rules
              skip it.
            </p>
          </div>
          {allowError && (
            <div className="px-4 pt-3">
              <Banner tone="error" onDismiss={() => setAllowError(null)}>
                {allowError}
              </Banner>
            </div>
          )}
          <div className="max-h-96 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 border-b border-dashboard-border/60 bg-dashboard-bg">
                <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                  <th className="px-4 py-2.5 font-medium">Domain</th>
                  <th className="px-4 py-2.5 text-right font-medium">Users</th>
                  <th className="px-4 py-2.5 text-right font-medium">BVN-verified</th>
                  <th className="px-4 py-2.5 font-medium">MX</th>
                  {canAllow && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {domains.map((d) => {
                  const tier = MX_TIER_LABEL[d.mx_tier] ?? MX_TIER_LABEL.not_checked;
                  const state = allowed[d.domain];
                  return (
                    <tr
                      key={d.domain}
                      className={d.bvn_verified_users > 0 ? "bg-amber-50/50" : ""}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-dashboard-heading">
                        {d.domain}
                      </td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-dashboard-heading">
                        {fmtNumber(d.users)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right text-xs tabular-nums ${
                          d.bvn_verified_users > 0
                            ? "font-semibold text-amber-700"
                            : "text-dashboard-muted"
                        }`}
                      >
                        {fmtNumber(d.bvn_verified_users)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${tier.className}`}
                        >
                          {tier.label}
                        </span>
                      </td>
                      {canAllow && (
                        <td className="px-4 py-2 text-right">
                          {state === "done" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <Check className="h-3.5 w-3.5" /> Allowed
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={state === "saving"}
                              onClick={() => allowDomain(d.domain, d.bvn_verified_users)}
                              className="inline-flex items-center gap-1 rounded-md border border-dashboard-border/60 px-2 py-1 text-[11px] font-medium text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
                            >
                              {state === "saving" ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ShieldPlus className="h-3 w-3" />
                              )}
                              Allow
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {prefixes.length > 0 && (
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
          <p className="text-sm font-semibold text-dashboard-heading">
            First two digits of verified BVNs
          </p>
          <p className="mt-0.5 text-xs text-dashboard-muted">
            Real BVNs start with 22. If nearly every verified BVN does, the
            prefix rule can move from flag to block — it also catches a NIN
            typed into the BVN box.
          </p>
          <div className="mt-3 space-y-1.5">
            {prefixes.slice(0, 12).map((p) => (
              <div key={p.prefix} className="flex items-center gap-3 text-xs">
                <span className="w-8 shrink-0 font-mono font-semibold text-dashboard-heading">
                  {p.prefix}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-dashboard-bg">
                  <div
                    className={`h-full rounded-full ${
                      p.prefix === "22" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${prefixMax > 0 ? (p.count / prefixMax) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right tabular-nums text-dashboard-muted">
                  {fmtNumber(p.count)} · {pct(p.count, prefixTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
  verified,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "red" | "amber" | "emerald";
  verified?: number;
}) {
  const color =
    tone === "red"
      ? "text-red-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "emerald"
          ? "text-emerald-700"
          : "text-dashboard-heading";
  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-dashboard-muted">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-dashboard-muted">{sub}</p>
      {typeof verified === "number" && (
        <p
          className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold ${
            verified > 0 ? "text-amber-700" : "text-dashboard-muted"
          }`}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          {fmtNumber(verified)} BVN-verified
        </p>
      )}
    </div>
  );
}

function RuleRow({
  rule,
  scanned,
  highlighted,
  open,
  onToggle,
}: {
  rule: BacktestRuleResult;
  scanned: number;
  highlighted: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const suspicious = rule.hits_bvn_verified > 0;
  return (
    <Fragment>
      <tr
        className={`${highlighted ? "bg-blue-50/60" : ""} ${
          rule.examples.length > 0 ? "cursor-pointer hover:bg-dashboard-bg/60" : ""
        }`}
        onClick={rule.examples.length > 0 ? onToggle : undefined}
      >
        <td className="px-4 py-2.5 align-top">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-dashboard-heading">{rule.label}</span>
            {highlighted && (
              <span className="rounded bg-blue-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-blue-700">
                Draft
              </span>
            )}
          </div>
          <p className="font-mono text-[10px] text-dashboard-muted">{rule.key}</p>
        </td>
        <td className="px-4 py-2.5 align-top">
          <ActionBadge action={rule.action} />
        </td>
        <td className="px-4 py-2.5 text-right align-top text-xs tabular-nums text-dashboard-heading">
          {fmtNumber(rule.hits)}
          <span className="ml-1 text-[10px] text-dashboard-muted">
            {pct(rule.hits, scanned)}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right align-top">
          <span
            className={`text-xs tabular-nums ${
              suspicious
                ? rule.action === "block"
                  ? "font-bold text-red-700"
                  : "font-semibold text-amber-700"
                : "text-dashboard-muted"
            }`}
          >
            {fmtNumber(rule.hits_bvn_verified)}
          </span>
          {suspicious && rule.action === "block" && (
            <p className="text-[10px] text-red-600">likely false positives</p>
          )}
        </td>
        <td className="px-2 py-2.5 align-top text-dashboard-muted">
          {rule.examples.length > 0 &&
            (open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            ))}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} className="bg-dashboard-bg/50 px-4 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted">
              Examples (masked)
            </p>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {rule.examples.map((ex, i) => (
                <li key={`${ex.user_id}-${i}`} className="flex items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-mono text-dashboard-heading">
                    {ex.value}
                  </span>
                  {ex.bvn_verified && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-px text-[9px] font-bold uppercase text-amber-800">
                      <BadgeCheck className="h-3 w-3" /> BVN
                    </span>
                  )}
                  <Link
                    href={`/unified-admin/users/${encodeURIComponent(ex.user_id)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-[11px] font-medium text-brand-bg-primary hover:underline"
                  >
                    User
                  </Link>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function BacktestPanel({
  fields,
  perms,
}: {
  fields?: GuardFieldInfo[];
  perms: GuardPerms;
}) {
  const [field, setField] = useState<GuardField>("email");
  const [sample, setSample] = useState(String(BACKTEST_SAMPLE_DEFAULT));
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResponse | null>(null);

  const sampleNum = Number(sample);
  const sampleValid =
    Number.isInteger(sampleNum) &&
    sampleNum >= BACKTEST_SAMPLE_MIN &&
    sampleNum <= BACKTEST_SAMPLE_MAX;

  const run = async (e: FormEvent) => {
    e.preventDefault();
    if (!sampleValid || running) return;
    setRunning(true);
    setError(null);
    try {
      setResult(
        await adminIdentityGuardsApi.backtest({ field, sample_size: sampleNum }),
      );
    } catch (err) {
      setError(errorMessage(err, "Backtest failed"));
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <header className="flex items-start gap-3 border-b border-dashboard-border/60 px-4 py-3.5 sm:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg">
          <History className="h-4 w-4 text-dashboard-heading" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-dashboard-heading">Backtest</h2>
          <p className="text-xs text-dashboard-muted">
            Replays the saved rules over the newest customers — read-only,
            nothing is written and no provider is called. Run it before
            switching a field to Enforce or promoting a flag rule to block.
          </p>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <form onSubmit={run} className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-dashboard-muted">
              Field
            </span>
            <select
              value={field}
              onChange={(e) => {
                setField(e.target.value as GuardField);
                setResult(null);
              }}
              className={`${fieldClass} w-40`}
            >
              {GUARD_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {fieldInfo(fields, f).label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-dashboard-muted">
              Customers ({BACKTEST_SAMPLE_MIN.toLocaleString()}–
              {BACKTEST_SAMPLE_MAX.toLocaleString()})
            </span>
            <input
              type="number"
              min={BACKTEST_SAMPLE_MIN}
              max={BACKTEST_SAMPLE_MAX}
              step={100}
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              className={`${fieldClass} w-32 tabular-nums ${
                sampleValid ? "" : "border-red-300"
              }`}
            />
          </label>
          <button
            type="submit"
            disabled={!sampleValid || running}
            className={primaryButtonClass}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? "Running…" : "Run backtest"}
          </button>
          {field === "email" && (
            <p className="basis-full text-[11px] text-dashboard-muted">
              Email backtests also look up MX for up to 300 distinct domains,
              so they can take a little longer.
            </p>
          )}
        </form>

        {error && <Banner tone="error">{error}</Banner>}

        {result && <BacktestResults result={result} fields={fields} perms={perms} />}
      </div>
    </section>
  );
}
