"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { FlaskConical, History, Loader2, Play, Save } from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import { BACKTEST_DRAFT_KEY } from "@/types/admin/identity-guards";
import type {
  BacktestResponse,
  DraftRule,
  GuardField,
  GuardFieldInfo,
  GuardMode,
  IdentityGuardRule,
  ParamDescriptor,
  RuleAction,
  RuleTypeDescriptor,
  SimulatePayload,
  SimulationResult,
  UpdateRulePayload,
} from "@/types/admin/identity-guards";
import { GuardModal } from "./GuardModal";
import { SimulationResultView } from "./SimulationResultView";
import { BacktestResults } from "./BacktestPanel";
import {
  RAW_PARAMS_DESCRIPTOR,
  initialDraft,
  parseParams,
  type ParamDraft,
} from "./rule-params";
import {
  Banner,
  FIELD_META,
  Switch,
  errorMessage,
  fieldClass,
  fieldInfo,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./shared";

const MESSAGE_MAX = 400;

function descriptorsFor(
  ruleTypes: RuleTypeDescriptor[],
  type: string | null,
): ParamDescriptor[] {
  if (!type) return [];
  const desc = ruleTypes.find((t) => t.type === type);
  return desc ? desc.params : [RAW_PARAMS_DESCRIPTOR];
}

export function RuleEditorModal({
  field,
  fields,
  mode,
  ruleTypes,
  rule,
  onClose,
  onSaved,
}: {
  field: GuardField;
  fields?: GuardFieldInfo[];
  mode: GuardMode;
  ruleTypes: RuleTypeDescriptor[];
  rule: IdentityGuardRule | null;
  onClose: () => void;
  onSaved: (rule: IdentityGuardRule) => void;
}) {
  const isEdit = rule !== null;
  const info = fieldInfo(fields, field);

  const available = useMemo(
    () => ruleTypes.filter((t) => t.custom_allowed && t.fields.includes(field)),
    [ruleTypes, field],
  );

  const [typeKey, setTypeKey] = useState<string | null>(rule?.type ?? null);
  const typeDesc = ruleTypes.find((t) => t.type === typeKey) ?? null;
  const descriptors = useMemo(
    () => descriptorsFor(ruleTypes, typeKey),
    [ruleTypes, typeKey],
  );

  const [draft, setDraft] = useState<ParamDraft>(() =>
    rule ? initialDraft(descriptorsFor(ruleTypes, rule.type), rule.params) : {},
  );
  const [label, setLabel] = useState(rule?.label ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  // New rules start as flag: log first, block once the Backtest looks clean.
  const [action, setAction] = useState<RuleAction>(rule?.action ?? "flag");
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState(rule?.message ?? "");

  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(
    () =>
      typeKey ? parseParams(descriptors, draft, rule?.params ?? {}) : null,
    [typeKey, descriptors, draft, rule],
  );
  const paramErrors = parsed && !parsed.ok ? parsed.errors : {};

  const draftRule = useMemo<DraftRule | null>(() => {
    if (!typeKey || !parsed?.ok) return null;
    return {
      field,
      type: typeKey,
      params: parsed.params,
      action,
      label: label.trim() || typeDesc?.label || typeKey,
      message: message.trim() || undefined,
    };
  }, [typeKey, parsed, field, action, label, message, typeDesc]);

  const pickType = (t: RuleTypeDescriptor) => {
    setTypeKey(t.type);
    setDraft(initialDraft(t.params, {}));
    setLabel((prev) => (prev.trim() ? prev : t.label));
    setShowErrors(false);
    setFormError(null);
  };

  const [testValue, setTestValue] = useState("");
  const [testNames, setTestNames] = useState({ first: "", middle: "", last: "" });
  const [testDns, setTestDns] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    result: SimulationResult;
    mode: GuardMode;
  } | null>(null);
  const [liveTest, setLiveTest] = useState(false);
  const testSeq = useRef(0);

  const hasTestInput =
    field === "name"
      ? Boolean(testNames.first.trim() || testNames.middle.trim() || testNames.last.trim())
      : testValue.trim().length > 0;

  const runTest = useCallback(async () => {
    if (!draftRule || !hasTestInput) return;
    const payload: SimulatePayload = { field, draft_rule: draftRule };
    if (field === "name") {
      payload.first_name = testNames.first;
      payload.middle_name = testNames.middle;
      payload.last_name = testNames.last;
    } else {
      payload.value = testValue;
    }
    if (field === "email") {
      payload.include_dns = testDns;
      payload.include_lists = false;
    }

    const seq = ++testSeq.current;
    setTesting(true);
    setTestError(null);
    try {
      const res = await adminIdentityGuardsApi.simulate(payload);
      if (seq !== testSeq.current) return;
      setTestResult(res.results[0] ? { result: res.results[0], mode: res.mode } : null);
    } catch (e) {
      if (seq !== testSeq.current) return;
      setTestError(errorMessage(e, "Test failed"));
    } finally {
      if (seq === testSeq.current) setTesting(false);
    }
  }, [draftRule, hasTestInput, field, testNames, testValue, testDns]);

  useEffect(() => {
    if (!liveTest || !draftRule || !hasTestInput) return;
    const timer = setTimeout(() => {
      void runTest();
    }, 600);
    return () => clearTimeout(timer);
  }, [liveTest, draftRule, hasTestInput, runTest]);

  const submitTest = (e: FormEvent) => {
    e.preventDefault();
    if (!draftRule) {
      setShowErrors(true);
      return;
    }
    setLiveTest(true);
    void runTest();
  };

  const [backtesting, setBacktesting] = useState(false);
  const [backtest, setBacktest] = useState<BacktestResponse | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  const runBacktest = async () => {
    if (!draftRule) {
      setShowErrors(true);
      return;
    }
    setBacktesting(true);
    setBacktestError(null);
    try {
      setBacktest(
        await adminIdentityGuardsApi.backtest({ field, draft_rule: draftRule }),
      );
    } catch (e) {
      setBacktestError(errorMessage(e, "Backtest failed"));
    } finally {
      setBacktesting(false);
    }
  };

  const isDraftRow = useCallback((key: string) => key === BACKTEST_DRAFT_KEY, []);

  const save = async () => {
    setShowErrors(true);
    setFormError(null);
    if (!typeKey) return;
    if (!label.trim()) {
      setFormError("Give the rule a label.");
      return;
    }
    if (!parsed?.ok) {
      setFormError("Fix the highlighted parameters first.");
      return;
    }

    if (rule && !rule.id) {
      setFormError("This rule hasn't been saved to the database yet — reload the page.");
      return;
    }

    const msg = message.trim();
    setSaving(true);
    try {
      if (rule?.id) {
        // Send only what changed so the audit log shows the real edit.
        const patch: UpdateRulePayload = {};
        if (label.trim() !== rule.label) patch.label = label.trim();
        if (description.trim() !== (rule.description ?? "")) {
          patch.description = description.trim();
        }
        if (JSON.stringify(parsed.params) !== JSON.stringify(rule.params)) {
          patch.params = parsed.params;
        }
        if (action !== rule.action) patch.action = action;
        if ((msg || null) !== (rule.message ?? null)) patch.message = msg || null;

        if (Object.keys(patch).length === 0) {
          onClose();
          return;
        }
        onSaved(await adminIdentityGuardsApi.updateRule(rule.id, patch));
      } else {
        onSaved(
          await adminIdentityGuardsApi.createRule({
            field,
            type: typeKey,
            label: label.trim(),
            description: description.trim() || undefined,
            params: parsed.params,
            action,
            enabled,
            message: msg || undefined,
          }),
        );
      }
    } catch (e) {
      setFormError(errorMessage(e, "Could not save the rule"));
    } finally {
      setSaving(false);
    }
  };

  const noun = FIELD_META[field].noun;
  const title = isEdit
    ? `Edit rule — ${rule.label}`
    : `Add ${noun === "email" ? "an" : "a"} ${noun} rule`;

  return (
    <GuardModal
      open
      onClose={onClose}
      title={title}
      subtitle={
        isEdit ? (
          <span className="font-mono">{rule.key}</span>
        ) : (
          "Custom rules run after the built-in ones. Start with Flag, check the Backtest, then switch to Block."
        )
      }
      size="xl"
      dismissOnBackdrop={false}
      footer={
        typeKey ? (
          <>
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className={primaryButtonClass}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "Save changes" : "Add rule"}
            </button>
          </>
        ) : undefined
      }
    >
      {!typeKey ? (
        <div className="space-y-3">
          <p className="text-sm text-dashboard-heading">Pick what the rule checks:</p>
          {available.length === 0 ? (
            <Banner tone="neutral">
              No custom rule types apply to {noun} checks. The
              built-in rules can still be edited from the table.
            </Banner>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {available.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => pickType(t)}
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2.5 text-left transition-colors hover:border-brand-bg-primary/50 hover:bg-brand-bg-primary/5"
                >
                  <p className="text-sm font-semibold text-dashboard-heading">{t.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-dashboard-muted">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {formError && <Banner tone="error">{formError}</Banner>}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-dashboard-bg px-3 py-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-dashboard-muted">
                Rule type
              </p>
              <p className="text-sm font-semibold text-dashboard-heading">
                {typeDesc?.label ?? typeKey}
              </p>
              {typeDesc?.description && (
                <p className="text-xs text-dashboard-muted">{typeDesc.description}</p>
              )}
            </div>
            {!isEdit && available.length > 1 && (
              <button
                type="button"
                onClick={() => setTypeKey(null)}
                className="text-xs font-medium text-brand-bg-primary hover:underline"
              >
                Change
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-dashboard-heading">
                Label <span className="text-red-500">*</span>
              </span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
                className={inputClass}
              />
            </label>
            <div>
              <span className="mb-1 block text-xs font-medium text-dashboard-heading">
                Action
              </span>
              <div className="inline-flex rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5">
                {(["flag", "block"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAction(a)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      action === a
                        ? a === "block"
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-amber-500 text-white shadow-sm"
                        : "text-dashboard-muted hover:text-dashboard-heading"
                    }`}
                  >
                    {a === "block" ? "Block" : "Flag (log only)"}
                  </button>
                ))}
              </div>
              {action === "block" && mode === "monitor" && (
                <p className="mt-1 text-[11px] text-blue-700">
                  {info.label} is in Monitor, so this only logs “would block” for now.
                </p>
              )}
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-dashboard-heading">
                Description
              </span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder="What this catches, for the next admin"
                className={inputClass}
              />
            </label>
          </div>

          {descriptors.length > 0 && (
            <fieldset className="space-y-3 rounded-lg border border-dashboard-border/60 p-3">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-dashboard-heading">
                Parameters
              </legend>
              {descriptors.map((d) => (
                <ParamInput
                  key={d.key}
                  desc={d}
                  value={draft[d.key]}
                  error={showErrors ? paramErrors[d.key] : undefined}
                  onChange={(v) => setDraft((prev) => ({ ...prev, [d.key]: v }))}
                />
              ))}
            </fieldset>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dashboard-heading">
              Message shown when this blocks
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={MESSAGE_MAX}
              placeholder={`Leave empty to use the standard ${noun} message (Settings → Security → Messages)`}
              className={inputClass}
            />
            <span className="mt-0.5 block text-right text-[10px] text-dashboard-muted">
              {message.length}/{MESSAGE_MAX}
            </span>
          </label>

          {!isEdit && (
            <label className="flex items-center gap-2.5">
              <Switch checked={enabled} onChange={setEnabled} label="Enabled" />
              <span className="text-xs text-dashboard-heading">
                Turn on as soon as it&apos;s saved
              </span>
            </label>
          )}

          <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-700" />
              <p className="text-sm font-semibold text-dashboard-heading">Test this rule</p>
              <span className="text-[11px] text-dashboard-muted">
                read-only · runs with the saved rules{isEdit ? " (including this rule’s saved version)" : ""}
              </span>
            </div>
            <form onSubmit={submitTest} className="space-y-2">
              {field === "name" ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["first", "First"],
                      ["middle", "Middle"],
                      ["last", "Last"],
                    ] as const
                  ).map(([key, placeholder]) => (
                    <input
                      key={key}
                      value={testNames[key]}
                      onChange={(e) =>
                        setTestNames((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      spellCheck={false}
                      className={`${inputClass} bg-dashboard-surface`}
                    />
                  ))}
                </div>
              ) : (
                <input
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder={FIELD_META[field].placeholder}
                  spellCheck={false}
                  autoComplete="off"
                  className={`${inputClass} bg-dashboard-surface font-mono`}
                />
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {field === "email" ? (
                  <label className="inline-flex items-center gap-2 text-xs text-dashboard-heading">
                    <input
                      type="checkbox"
                      checked={testDns}
                      onChange={(e) => setTestDns(e.target.checked)}
                      className="h-3.5 w-3.5 accent-brand-bg-primary"
                    />
                    Check DNS/MX <span className="text-dashboard-muted">(network lookup)</span>
                  </label>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={runBacktest}
                    disabled={backtesting}
                    className={secondaryButtonClass}
                    title="Replay this draft over the newest 2,000 customers"
                  >
                    {backtesting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <History className="h-3.5 w-3.5" />
                    )}
                    Backtest draft
                  </button>
                  <button
                    type="submit"
                    disabled={!hasTestInput || testing}
                    className={`${primaryButtonClass} px-3 py-1.5 text-xs`}
                  >
                    {testing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Test
                  </button>
                </div>
              </div>
            </form>

            {testError && <Banner tone="error">{testError}</Banner>}
            {testResult && (
              <div className="rounded-lg border border-dashboard-border/60 bg-dashboard-surface p-3">
                <SimulationResultView
                  result={testResult.result}
                  mode={testResult.mode}
                  fieldLabel={info.label}
                  compact
                />
              </div>
            )}

            {backtestError && <Banner tone="error">{backtestError}</Banner>}
            {backtest && (
              <BacktestResults
                result={backtest}
                fields={fields}
                highlightKeys={isDraftRow}
                compact
              />
            )}
          </div>
        </div>
      )}
    </GuardModal>
  );
}

function ParamInput({
  desc,
  value,
  error,
  onChange,
}: {
  desc: ParamDescriptor;
  value: string | boolean | undefined;
  error?: string;
  onChange: (next: string | boolean) => void;
}) {
  const text = typeof value === "string" ? value : "";
  const listCount =
    desc.kind === "string_list"
      ? text.split(/\r?\n/).filter((l) => l.trim()).length
      : 0;
  const errorBorder = error ? "border-red-300 focus:ring-red-200" : "";

  if (desc.kind === "boolean") {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-dashboard-heading">{desc.label}</p>
          {desc.help && <p className="mt-0.5 text-[11px] text-dashboard-muted">{desc.help}</p>}
        </div>
        <Switch checked={value === true} onChange={onChange} label={desc.label} />
      </div>
    );
  }

  return (
    <label className="block">
      <span className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-dashboard-heading">
          {desc.label}
          {desc.required && <span className="text-red-500"> *</span>}
        </span>
        {desc.kind === "number" &&
          (typeof desc.min === "number" || typeof desc.max === "number") && (
            <span className="text-[10px] text-dashboard-muted">
              {typeof desc.min === "number" ? desc.min : "…"}–
              {typeof desc.max === "number" ? desc.max : "…"}
            </span>
          )}
        {desc.kind === "string_list" && (
          <span className="text-[10px] text-dashboard-muted">
            one per line · {listCount} {listCount === 1 ? "entry" : "entries"}
          </span>
        )}
      </span>
      {desc.help && (
        <span className="mt-0.5 block text-[11px] text-dashboard-muted">{desc.help}</span>
      )}
      <span className="mt-1 block">
        {desc.kind === "number" ? (
          <input
            type="number"
            value={text}
            min={desc.min}
            max={desc.max}
            onChange={(e) => onChange(e.target.value)}
            className={`${fieldClass} w-36 tabular-nums ${errorBorder}`}
          />
        ) : desc.kind === "enum" ? (
          <select
            value={text}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} ${errorBorder}`}
          >
            {(desc.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : desc.kind === "string_list" || desc.kind === "json" ? (
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.min(10, Math.max(desc.kind === "json" ? 6 : 4, text.split("\n").length))}
            spellCheck={false}
            className={`${inputClass} font-mono text-xs leading-relaxed ${errorBorder}`}
          />
        ) : (
          <input
            value={text}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className={`${inputClass} font-mono ${errorBorder}`}
          />
        )}
      </span>
      {error && <span className="mt-1 block text-[11px] text-red-600">{error}</span>}
    </label>
  );
}
