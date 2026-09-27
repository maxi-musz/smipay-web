"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ChevronDown, ChevronRight, FlaskConical, Loader2, Play } from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import {
  GUARD_FIELDS,
  SIMULATE_BATCH_MAX,
  type GuardField,
  type GuardFieldInfo,
  type GuardMode,
  type GuardVerdict,
  type SimulatePayload,
  type SimulateResponse,
} from "@/types/admin/identity-guards";
import { SimulationResultView } from "./SimulationResultView";
import {
  Banner,
  FIELD_META,
  MODE_META,
  VERDICT_META,
  VerdictBadge,
  errorMessage,
  fieldInfo,
  inputClass,
  primaryButtonClass,
} from "./shared";

const VERDICT_ORDER: GuardVerdict[] = ["block", "would_block", "flag", "pass"];

export function Simulator({
  modes,
  fields,
  bvnSandbox = false,
  compact = false,
}: {
  modes?: Record<GuardField, GuardMode> | null;
  fields?: GuardFieldInfo[];
  bvnSandbox?: boolean;
  compact?: boolean;
}) {
  const [field, setField] = useState<GuardField>("email");
  const [batch, setBatch] = useState(false);
  const [value, setValue] = useState("");
  const [names, setNames] = useState({ first: "", middle: "", last: "" });
  const [batchText, setBatchText] = useState("");
  const [includeDns, setIncludeDns] = useState(false);
  const [includeLists, setIncludeLists] = useState(true);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SimulateResponse | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const batchLines = useMemo(
    () =>
      batchText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    [batchText],
  );

  const info = fieldInfo(fields, field);
  const responseLabel = response ? fieldInfo(fields, response.field).label : "";

  const pickField = (next: GuardField) => {
    setField(next);
    setResponse(null);
    setError(null);
    setExpanded(null);
  };

  const canRun = batch
    ? batchLines.length > 0 && batchLines.length <= SIMULATE_BATCH_MAX
    : field === "name"
      ? Boolean(names.first.trim() || names.middle.trim() || names.last.trim())
      : value.trim().length > 0;

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canRun || running) return;

    const payload: SimulatePayload = { field };
    if (batch) {
      payload.values = batchLines;
    } else if (field === "name") {
      payload.first_name = names.first;
      payload.middle_name = names.middle;
      payload.last_name = names.last;
    } else {
      payload.value = value;
    }
    if (field === "email") {
      payload.include_dns = includeDns;
      payload.include_lists = includeLists;
    }

    setRunning(true);
    setError(null);
    try {
      const res = await adminIdentityGuardsApi.simulate(payload);
      setResponse(res);
      setExpanded(null);
    } catch (err) {
      setError(errorMessage(err, "Simulation failed"));
    } finally {
      setRunning(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<GuardVerdict, number> = {
      block: 0,
      would_block: 0,
      flag: 0,
      pass: 0,
    };
    for (const r of response?.results ?? []) c[r.verdict] = (c[r.verdict] ?? 0) + 1;
    return c;
  }, [response]);

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="radiogroup"
            aria-label="Field"
            className="inline-flex flex-wrap rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5"
          >
            {GUARD_FIELDS.map((f) => {
              const active = f === field;
              const Icon = FIELD_META[f].icon;
              const mode = modes?.[f];
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickField(f)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-dashboard-surface text-dashboard-heading shadow-sm"
                      : "text-dashboard-muted hover:text-dashboard-heading"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {fieldInfo(fields, f).label}
                  {mode && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wide ${
                        mode === "enforce"
                          ? "text-emerald-600"
                          : mode === "monitor"
                            ? "text-blue-600"
                            : "text-slate-500"
                      }`}
                    >
                      {MODE_META[mode].label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="inline-flex rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5 text-xs font-semibold">
            {[
              { id: false, label: "Single" },
              { id: true, label: `Batch (≤${SIMULATE_BATCH_MAX})` },
            ].map((opt) => (
              <button
                key={String(opt.id)}
                type="button"
                onClick={() => {
                  setBatch(opt.id);
                  setResponse(null);
                  setError(null);
                }}
                className={`rounded-md px-2.5 py-1.5 transition-colors ${
                  batch === opt.id
                    ? "bg-dashboard-surface text-dashboard-heading shadow-sm"
                    : "text-dashboard-muted hover:text-dashboard-heading"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {field === "bvn" && bvnSandbox && (
          <Banner tone="info">
            Dojah is in sandbox, so the Dojah BVN flows skip these rules — only
            the 11-digit floor runs there. Results below show exactly that.
          </Banner>
        )}

        {batch ? (
          <div>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              rows={compact ? 5 : 7}
              spellCheck={false}
              placeholder={FIELD_META[field].batchPlaceholder}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
            />
            <p
              className={`mt-1 text-[11px] ${
                batchLines.length > SIMULATE_BATCH_MAX
                  ? "text-red-600"
                  : "text-dashboard-muted"
              }`}
            >
              {batchLines.length}/{SIMULATE_BATCH_MAX} lines
              {field === "name" &&
                " · one person per line: First Middle Last (first word = first name, last word = last name)"}
            </p>
          </div>
        ) : field === "name" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                ["first", "First name", "Chiamaka"],
                ["middle", "Middle name (optional)", "Ngozi"],
                ["last", "Last name", "Okafor"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] font-medium text-dashboard-muted">
                  {label}
                </span>
                <input
                  value={names[key]}
                  onChange={(e) =>
                    setNames((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  spellCheck={false}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={FIELD_META[field].placeholder}
            spellCheck={false}
            autoComplete="off"
            className={`${inputClass} font-mono`}
          />
        )}

        {field === "email" && (
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <label className="inline-flex items-center gap-2 text-xs text-dashboard-heading">
              <input
                type="checkbox"
                checked={includeDns}
                onChange={(e) => setIncludeDns(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-dashboard-border accent-brand-bg-primary"
              />
              Check DNS/MX
              <span className="text-dashboard-muted">(network lookup)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-dashboard-heading">
              <input
                type="checkbox"
                checked={includeLists}
                onChange={(e) => setIncludeLists(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-dashboard-border accent-brand-bg-primary"
              />
              Include disposable dataset &amp; domain lists
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-dashboard-muted">
            Floor: {info.floor} Nothing is saved and no provider is called.
          </p>
          <button
            type="submit"
            disabled={!canRun || running}
            className={primaryButtonClass}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {batch ? `Run ${batchLines.length || ""}`.trim() : "Run"}
          </button>
        </div>
      </form>

      {error && <Banner tone="error">{error}</Banner>}

      {response && response.results.length === 0 && (
        <p className="text-sm text-dashboard-muted">No results returned.</p>
      )}

      {response && response.results.length === 1 && !batch && (
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
          <SimulationResultView
            result={response.results[0]}
            mode={response.mode}
            fieldLabel={responseLabel}
            compact={compact}
          />
        </div>
      )}

      {response && (batch || response.results.length > 1) && response.results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
          <div className="flex flex-wrap items-center gap-2 border-b border-dashboard-border/40 px-4 py-2.5">
            <span className="text-xs font-semibold text-dashboard-heading">
              {response.results.length} value{response.results.length === 1 ? "" : "s"}
            </span>
            <span className="text-[11px] text-dashboard-muted">
              · {responseLabel} is in {MODE_META[response.mode]?.label ?? response.mode}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {VERDICT_ORDER.filter((v) => counts[v] > 0).map((v) => (
                <span
                  key={v}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${VERDICT_META[v].className}`}
                >
                  {counts[v]} {VERDICT_META[v].label}
                </span>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-dashboard-border/40">
            {response.results.map((r, i) => {
              const open = expanded === i;
              const hits = r.trace.filter((t) => t.hit && !t.skipped);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : i)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left hover:bg-dashboard-bg/60"
                  >
                    {open ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-dashboard-muted" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-dashboard-muted" />
                    )}
                    <VerdictBadge verdict={r.verdict} />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-dashboard-heading">
                      {r.input}
                    </span>
                    <span className="hidden max-w-[45%] truncate text-[11px] text-dashboard-muted sm:inline">
                      {!r.floor.passed
                        ? "Floor"
                        : hits.length > 0
                          ? hits.map((h) => h.label).join(", ")
                          : r.email_pipeline?.would_block
                            ? "Email checks would block"
                            : "—"}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-dashboard-border/40 bg-dashboard-bg/40 px-4 py-3">
                      <SimulationResultView
                        result={r}
                        mode={response.mode}
                        fieldLabel={responseLabel}
                        compact
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!response && !error && !compact && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-dashboard-border/60 px-4 py-5 text-xs text-dashboard-muted">
          <FlaskConical className="h-4 w-4 shrink-0" />
          Enter a value and run it to see the normalised form, the verdict under
          the current mode, the exact message a user would get, and every rule&apos;s
          outcome.
        </div>
      )}
    </div>
  );
}
