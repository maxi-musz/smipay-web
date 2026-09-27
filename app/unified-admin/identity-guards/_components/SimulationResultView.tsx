"use client";

import { useState } from "react";
import { ArrowRight, MessageSquareQuote, Server, ShieldCheck } from "lucide-react";
import type {
  EmailPipelineResult,
  GuardMode,
  SimulationResult,
  SimulationTraceItem,
} from "@/types/admin/identity-guards";
import { ActionBadge, PART_LABEL, SKIP_LABEL, VerdictBadge } from "./shared";

function verdictNote(
  result: SimulationResult,
  mode: GuardMode,
  fieldLabel: string,
): string {
  if (!result.floor.passed) {
    return "Stopped by the floor check, which applies in every mode.";
  }
  switch (result.verdict) {
    case "block":
      return `${fieldLabel} is in Enforce — the user is stopped with the message below.`;
    case "would_block":
      return `${fieldLabel} is in Monitor — this is only logged as “would block”; the user gets through.`;
    case "flag":
      return "Logged for review; the user gets through.";
    default:
      return mode === "off"
        ? `${fieldLabel} rules are Off — only the floor ran.`
        : "No rule tripped.";
  }
}

function TraceStatus({
  item,
  mode,
}: {
  item: SimulationTraceItem;
  mode: GuardMode;
}) {
  if (item.skipped) {
    return (
      <span className="text-[11px] text-dashboard-muted">
        {SKIP_LABEL[item.skipped] ?? item.skipped.replace(/_/g, " ")}
      </span>
    );
  }
  if (!item.hit) {
    return <span className="text-[11px] text-dashboard-muted">Pass</span>;
  }
  if (item.action === "block") {
    return (
      <span className="text-[11px] font-semibold text-red-700">
        {mode === "enforce" ? "Blocks" : "Would block"}
      </span>
    );
  }
  return <span className="text-[11px] font-semibold text-amber-700">Flags</span>;
}

function TraceTable({
  trace,
  mode,
  collapsible,
}: {
  trace: SimulationTraceItem[];
  mode: GuardMode;
  collapsible: boolean;
}) {
  const [showAll, setShowAll] = useState(!collapsible);
  const important = trace.filter((t) => t.hit || t.draft);
  const rows = showAll ? trace : important;
  const hidden = trace.length - rows.length;

  if (trace.length === 0) {
    return (
      <p className="text-xs text-dashboard-muted">
        No rules ran for this field.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-dashboard-border/60">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="border-b border-dashboard-border/60 bg-dashboard-bg">
            <tr className="text-left text-[10px] uppercase tracking-wider text-dashboard-muted">
              <th className="px-3 py-2 font-medium">Rule</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Result</th>
              <th className="px-3 py-2 font-medium">Why</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-border/40">
            {rows.map((t, i) => (
              <tr
                key={`${t.key}-${t.part ?? ""}-${i}`}
                className={
                  t.hit && !t.skipped
                    ? t.action === "block"
                      ? "bg-red-50/60"
                      : "bg-amber-50/60"
                    : t.draft
                      ? "bg-blue-50/50"
                      : ""
                }
              >
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`font-medium ${
                        t.enabled || t.draft
                          ? "text-dashboard-heading"
                          : "text-dashboard-muted line-through decoration-dashboard-muted/50"
                      }`}
                    >
                      {t.label}
                    </span>
                    {t.draft && (
                      <span className="rounded bg-blue-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-blue-700">
                        Draft
                      </span>
                    )}
                    {t.part && (
                      <span className="rounded bg-dashboard-bg px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-dashboard-muted">
                        {PART_LABEL[t.part] ?? t.part}
                      </span>
                    )}
                  </div>
                  {!t.draft && (
                    <p className="mt-0.5 font-mono text-[10px] text-dashboard-muted">
                      {t.key}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <ActionBadge action={t.action} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 align-top">
                  <TraceStatus item={t} mode={mode} />
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-dashboard-heading">
                  {t.detail || <span className="text-dashboard-muted">—</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-3 text-center text-[11px] text-dashboard-muted"
                >
                  No rule tripped.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {collapsible && trace.length > important.length && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full border-t border-dashboard-border/40 px-3 py-1.5 text-[11px] font-medium text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
        >
          {showAll
            ? "Show only rules that tripped"
            : `Show all ${trace.length} rules (${hidden} passed or skipped)`}
        </button>
      )}
    </div>
  );
}

function EmailPipelinePanel({ pipeline }: { pipeline: EmailPipelineResult }) {
  return (
    <div className="rounded-lg border border-dashboard-border/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-dashboard-heading">
          Existing email checks
          <span className="ml-1 font-normal text-dashboard-muted">
            (domain lists → disposable dataset → MX, after the rules)
          </span>
        </p>
        {pipeline.ran ? (
          pipeline.would_block ? (
            <VerdictBadge verdict="block" />
          ) : (
            <VerdictBadge verdict="pass" />
          )
        ) : (
          <span className="text-[11px] text-dashboard-muted">Not run</span>
        )}
      </div>

      {!pipeline.ran ? (
        <p className="mt-1.5 text-[11px] text-dashboard-muted">
          Tick “Include disposable dataset &amp; domain lists” to run them, or
          the rules already stopped this address first.
        </p>
      ) : (
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
          {pipeline.reason && (
            <Row label="Reason" value={pipeline.reason.replace(/_/g, " ")} />
          )}
          {pipeline.disposable_source && (
            <Row label="Disposable source" value={pipeline.disposable_source} />
          )}
          {pipeline.matched && <Row label="Matched list entry" value={pipeline.matched} mono />}
          {pipeline.suggestion && (
            <Row label="Did you mean" value={pipeline.suggestion} mono />
          )}
          {!pipeline.valid && !pipeline.would_block && (
            <Row
              label="Outcome"
              value="Would be flagged, not blocked, under the current security policy"
            />
          )}
          {pipeline.message && (
            <div className="sm:col-span-2">
              <dt className="text-dashboard-muted">Message shown</dt>
              <dd className="text-dashboard-heading">“{pipeline.message}”</dd>
            </div>
          )}
        </dl>
      )}

      {pipeline.mx && (
        <div className="mt-2.5 flex items-start gap-2 rounded-md bg-dashboard-bg px-2.5 py-2 text-[11px]">
          <Server className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dashboard-muted" />
          <div className="min-w-0">
            <span className="font-semibold text-dashboard-heading">MX: </span>
            {pipeline.mx.inconclusive ? (
              <span className="text-amber-700">
                DNS didn&apos;t answer — inconclusive (the allowlist only flags)
              </span>
            ) : pipeline.mx.ok && pipeline.mx.hosts.length > 0 ? (
              <span className="break-all font-mono text-dashboard-heading">
                {pipeline.mx.hosts.join(", ")}
              </span>
            ) : (
              <span className="text-red-700">No mail servers for this domain</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-dashboard-muted">{label}</dt>
      <dd className={`break-all text-dashboard-heading ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export function SimulationResultView({
  result,
  mode,
  fieldLabel,
  compact = false,
}: {
  result: SimulationResult;
  mode: GuardMode;
  fieldLabel: string;
  compact?: boolean;
}) {
  const stops = result.verdict === "block" || result.verdict === "would_block";
  const normalizedDiffers =
    result.normalized !== null && result.normalized !== result.input;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="break-all font-mono text-dashboard-heading">
              {result.input || <span className="text-dashboard-muted">(empty)</span>}
            </span>
            {normalizedDiffers && (
              <>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-dashboard-muted" />
                <span className="break-all font-mono text-dashboard-heading">
                  {result.normalized}
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-dashboard-muted">
            {result.normalized === null
              ? "Could not be normalised"
              : normalizedDiffers
                ? "Normalised to the stored form"
                : "Already in the stored form"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {result.code && (
            <span className="rounded bg-dashboard-bg px-1.5 py-0.5 font-mono text-[10px] text-dashboard-muted">
              {result.code}
            </span>
          )}
          <VerdictBadge verdict={result.verdict} />
        </div>
      </div>

      <p className="text-xs text-dashboard-heading">
        {verdictNote(result, mode, fieldLabel)}
      </p>

      {!result.floor.passed && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">Floor: </span>
            {result.floor.message || "Fails the fixed shape check."}
          </span>
        </div>
      )}

      {result.user_message && (stops || !result.floor.passed) && (
        <div className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            {result.verdict === "would_block"
              ? "What the user would see under Enforce"
              : "What the user sees"}
          </p>
          <p className="mt-1 text-sm text-dashboard-heading">
            “{result.user_message}”
          </p>
        </div>
      )}

      <TraceTable trace={result.trace} mode={mode} collapsible={compact} />

      {result.email_pipeline && <EmailPipelinePanel pipeline={result.email_pipeline} />}
    </div>
  );
}
