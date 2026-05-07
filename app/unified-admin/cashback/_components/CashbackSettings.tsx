"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Save,
  Loader2,
  Power,
  Sprout,
  Trash2,
  AlertTriangle,
  Check,
  Undo2,
} from "lucide-react";
import { adminCashbackApi } from "@/services/admin/cashback-api";
import type {
  CashbackConfig,
  CashbackRule,
  CashbackConfigPayload,
  CashbackServiceType,
} from "@/types/admin/cashback";
import { CASHBACK_SERVICE_TYPES } from "@/types/admin/cashback";

interface CashbackSettingsProps {
  config: CashbackConfig;
  rules: CashbackRule[];
  onSaved: () => void;
}

function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export function CashbackSettings({
  config,
  rules,
  onSaved,
}: CashbackSettingsProps) {
  const [configForm, setConfigForm] = useState({
    is_active: config.is_active,
    default_percentage: config.default_percentage,
    max_cashback_per_transaction: config.max_cashback_per_transaction,
    max_cashback_per_day: config.max_cashback_per_day,
    min_transaction_amount: config.min_transaction_amount,
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const [ruleEdits, setRuleEdits] = useState<
    Record<string, Partial<CashbackRule>>
  >({});
  const [ruleSaving, setRuleSaving] = useState<string | null>(null);
  const [ruleSuccess, setRuleSuccess] = useState<string | null>(null);
  const [ruleToggling, setRuleToggling] = useState<string | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CashbackRule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setConfigForm({
      is_active: config.is_active,
      default_percentage: config.default_percentage,
      max_cashback_per_transaction: config.max_cashback_per_transaction,
      max_cashback_per_day: config.max_cashback_per_day,
      min_transaction_amount: config.min_transaction_amount,
    });
  }, [config]);

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigError(null);
    setConfigSuccess(false);
    try {
      const payload: CashbackConfigPayload = {};
      if (configForm.is_active !== config.is_active)
        payload.is_active = configForm.is_active;
      if (configForm.default_percentage !== config.default_percentage)
        payload.default_percentage = configForm.default_percentage;
      if (
        configForm.max_cashback_per_transaction !==
        config.max_cashback_per_transaction
      )
        payload.max_cashback_per_transaction =
          configForm.max_cashback_per_transaction;
      if (configForm.max_cashback_per_day !== config.max_cashback_per_day)
        payload.max_cashback_per_day = configForm.max_cashback_per_day;
      if (configForm.min_transaction_amount !== config.min_transaction_amount)
        payload.min_transaction_amount = configForm.min_transaction_amount;

      if (Object.keys(payload).length === 0) return;
      await adminCashbackApi.updateConfig(payload);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 2000);
      onSaved();
    } catch (err) {
      setConfigError(
        err instanceof Error ? err.message : "Failed to save config",
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const handleToggleProgram = async () => {
    setToggleConfirm(false);
    setConfigSaving(true);
    try {
      await adminCashbackApi.updateConfig({
        is_active: !config.is_active,
      });
      onSaved();
    } catch (err) {
      setConfigError(
        err instanceof Error ? err.message : "Failed to toggle program",
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSeedRules = async () => {
    setSeeding(true);
    try {
      await adminCashbackApi.seedRules();
      onSaved();
    } catch {
      // non-critical
    } finally {
      setSeeding(false);
    }
  };

  const handleToggleRule = async (rule: CashbackRule) => {
    setRuleToggling(rule.id);
    try {
      await adminCashbackApi.updateRule(rule.id, {
        is_active: !rule.is_active,
      });
      onSaved();
    } catch {
      // handled
    } finally {
      setRuleToggling(null);
    }
  };

  const getRuleEdit = useCallback(
    (rule: CashbackRule) => {
      const edit = ruleEdits[rule.id];
      return {
        percentage: edit?.percentage ?? rule.percentage,
        max_cashback_amount:
          edit?.max_cashback_amount !== undefined
            ? edit.max_cashback_amount
            : rule.max_cashback_amount,
        min_transaction_amount:
          edit?.min_transaction_amount !== undefined
            ? edit.min_transaction_amount
            : rule.min_transaction_amount,
      };
    },
    [ruleEdits],
  );

  const setRuleField = (
    ruleId: string,
    field: string,
    value: number | boolean | null,
  ) => {
    setRuleEdits((prev) => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], [field]: value },
    }));
  };

  const clearRuleEdit = (ruleId: string) => {
    setRuleEdits((prev) => {
      const next = { ...prev };
      delete next[ruleId];
      return next;
    });
  };

  const handleSaveRule = async (rule: CashbackRule) => {
    const edit = ruleEdits[rule.id];
    if (!edit) return;

    setRuleSaving(rule.id);
    try {
      const payload: Record<string, unknown> = {};
      if (edit.percentage !== undefined && edit.percentage !== rule.percentage)
        payload.percentage = edit.percentage;
      if (edit.max_cashback_amount !== undefined)
        payload.max_cashback_amount = edit.max_cashback_amount;
      if (edit.min_transaction_amount !== undefined)
        payload.min_transaction_amount = edit.min_transaction_amount;

      if (Object.keys(payload).length === 0) return;
      await adminCashbackApi.updateRule(rule.id, payload);
      setRuleEdits((prev) => {
        const next = { ...prev };
        delete next[rule.id];
        return next;
      });
      setRuleSuccess(rule.id);
      setTimeout(() => setRuleSuccess(null), 2000);
      onSaved();
    } catch {
      // handled
    } finally {
      setRuleSaving(null);
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminCashbackApi.deleteRule(deleteTarget.id);
      setDeleteTarget(null);
      onSaved();
    } catch {
      // handled
    } finally {
      setDeleteLoading(false);
    }
  };

  const configDirty =
    configForm.default_percentage !== config.default_percentage ||
    configForm.max_cashback_per_transaction !==
      config.max_cashback_per_transaction ||
    configForm.max_cashback_per_day !== config.max_cashback_per_day ||
    configForm.min_transaction_amount !== config.min_transaction_amount;

  const serviceLabel = (type: CashbackServiceType) =>
    CASHBACK_SERVICE_TYPES.find((s) => s.value === type)?.label ?? type;

  return (
    <div className="space-y-4">
      {/* Master Switch */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${config.is_active ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}
            >
              <Power className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dashboard-heading">
                Cashback Program
              </p>
              <p className="text-[11px] text-dashboard-muted">
                {config.is_active
                  ? "Active — users receive cashback on eligible purchases"
                  : "Inactive — no cashback is being given"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToggleConfirm(true)}
            disabled={configSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${config.is_active ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </motion.div>

      {/* Global Config */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3"
      >
        <h3 className="text-xs font-bold text-dashboard-heading mb-3">
          Global Defaults
        </h3>
        {configError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
            {configError}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Default Cashback %"
            value={configForm.default_percentage}
            onChange={(v) =>
              setConfigForm((p) => ({ ...p, default_percentage: v }))
            }
            suffix="%"
            step={0.5}
          />
          <InputField
            label="Min Purchase Amount"
            value={configForm.min_transaction_amount}
            onChange={(v) =>
              setConfigForm((p) => ({ ...p, min_transaction_amount: v }))
            }
            prefix="₦"
          />
          <InputField
            label="Max Per Transaction"
            value={configForm.max_cashback_per_transaction}
            onChange={(v) =>
              setConfigForm((p) => ({
                ...p,
                max_cashback_per_transaction: v,
              }))
            }
            prefix="₦"
          />
          <InputField
            label="Max Per Day"
            value={configForm.max_cashback_per_day}
            onChange={(v) =>
              setConfigForm((p) => ({ ...p, max_cashback_per_day: v }))
            }
            prefix="₦"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={!configDirty || configSaving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {configSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Config
          </button>
          <AnimatePresence>
            {configSuccess && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-600 font-medium flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Per-Service Rules */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-dashboard-border/60">
          <h3 className="text-xs font-bold text-dashboard-heading">
            Per-Service Rules
          </h3>
          {rules.length === 0 ? (
            <button
              type="button"
              onClick={handleSeedRules}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {seeding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sprout className="h-3.5 w-3.5" />
              )}
              Seed All Rules
            </button>
          ) : (
            <p className="text-[10px] text-dashboard-muted">
              Empty fields = use global defaults
            </p>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Sprout className="h-8 w-8 text-dashboard-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-dashboard-heading mb-1">
              No rules configured yet
            </p>
            <p className="text-xs text-dashboard-muted max-w-xs mx-auto">
              Click &ldquo;Seed All Rules&rdquo; to create default rules for
              every service. You can then customize each one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dashboard-border/40">
            {/* Header (desktop) */}
            <div className="hidden lg:grid grid-cols-[1fr_80px_80px_100px_100px_80px] gap-3 px-4 py-2 text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider bg-dashboard-bg/50">
              <span>Service</span>
              <span>Active</span>
              <span>%</span>
              <span>Max ₦</span>
              <span>Min ₦</span>
              <span />
            </div>

            {rules.map((rule) => {
              const edited = getRuleEdit(rule);
              const hasEdits = !!ruleEdits[rule.id];
              const saving = ruleSaving === rule.id;
              const saved = ruleSuccess === rule.id;

              return (
                <div
                  key={rule.id}
                  className="px-4 py-2.5 hover:bg-dashboard-bg/30 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="lg:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-dashboard-heading">
                        {serviceLabel(rule.service_type)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule)}
                          disabled={ruleToggling === rule.id}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.is_active ? "bg-emerald-500" : "bg-slate-300"} ${ruleToggling === rule.id ? "opacity-50" : ""}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${rule.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rule)}
                          className="p-1 text-dashboard-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <MiniInput
                        label="%"
                        value={edited.percentage}
                        onChange={(v) =>
                          setRuleField(rule.id, "percentage", v)
                        }
                      />
                      <MiniInput
                        label="Max ₦"
                        value={edited.max_cashback_amount}
                        onChange={(v) =>
                          setRuleField(rule.id, "max_cashback_amount", v)
                        }
                      />
                      <MiniInput
                        label="Min ₦"
                        value={edited.min_transaction_amount}
                        onChange={(v) =>
                          setRuleField(
                            rule.id,
                            "min_transaction_amount",
                            v,
                          )
                        }
                      />
                    </div>
                    {hasEdits && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveRule(rule)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-md bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => clearRuleEdit(rule.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-md border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg transition-colors"
                        >
                          <Undo2 className="h-3 w-3" />
                          Cancel
                        </button>
                        {saved && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Saved!
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden lg:grid grid-cols-[1fr_80px_80px_100px_100px_80px] gap-3 items-center">
                    <span className="text-xs font-semibold text-dashboard-heading">
                      {serviceLabel(rule.service_type)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule)}
                      disabled={ruleToggling === rule.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.is_active ? "bg-emerald-500" : "bg-slate-300"} ${ruleToggling === rule.id ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${rule.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                      />
                    </button>
                    <MiniInput
                      value={edited.percentage}
                      onChange={(v) =>
                        setRuleField(rule.id, "percentage", v)
                      }
                    />
                    <MiniInput
                      value={edited.max_cashback_amount}
                      onChange={(v) =>
                        setRuleField(rule.id, "max_cashback_amount", v)
                      }
                      placeholder="Global"
                    />
                    <MiniInput
                      value={edited.min_transaction_amount}
                      onChange={(v) =>
                        setRuleField(rule.id, "min_transaction_amount", v)
                      }
                      placeholder="Global"
                    />
                    <div className="flex items-center gap-1">
                      {hasEdits && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveRule(rule)}
                            disabled={saving}
                            className="p-1.5 rounded-md bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
                            title="Save changes"
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : saved ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => clearRuleEdit(rule.id)}
                            className="p-1.5 rounded-md text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg border border-dashboard-border/60 transition-colors"
                            title="Cancel edit"
                          >
                            <Undo2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(rule)}
                        className="p-1.5 rounded-md text-dashboard-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {config.updatedAt && (
          <div className="px-4 py-2 border-t border-dashboard-border/60 bg-dashboard-bg/30">
            <p className="text-[10px] text-dashboard-muted">
              Last updated:{" "}
              {new Date(config.updatedAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </motion.div>

      {/* Toggle confirmation dialog */}
      <AnimatePresence>
        {toggleConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-sm p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-dashboard-heading">
                    {config.is_active ? "Disable" : "Enable"} Cashback
                  </h3>
                  <p className="text-xs text-dashboard-muted">
                    {config.is_active
                      ? "Users will stop receiving cashback on all purchases."
                      : "Users will start receiving cashback on eligible purchases."}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setToggleConfirm(false)}
                  className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleProgram}
                  className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors ${config.is_active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {config.is_active ? "Turn Off" : "Turn On"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-sm p-5"
            >
              <h3 className="text-sm font-bold text-dashboard-heading mb-1">
                Delete Rule
              </h3>
              <p className="text-xs text-dashboard-muted mb-4">
                Remove the{" "}
                <strong>{serviceLabel(deleteTarget.service_type)}</strong> rule?
                Transactions for this service will fall back to the default{" "}
                {config.default_percentage}%.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRule}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete Rule"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helpers ---

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-dashboard-muted">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          step={step}
          min={0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 ${prefix ? "pl-7 pr-2.5" : "px-2.5"} ${suffix ? "pr-7" : ""}`}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-dashboard-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function MiniInput({
  label,
  value,
  onChange,
  placeholder = "0",
}: {
  label?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[9px] font-medium text-dashboard-muted mb-0.5 lg:hidden">
          {label}
        </label>
      )}
      <input
        type="number"
        value={value ?? ""}
        placeholder={placeholder}
        min={0}
        step={0.5}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-md text-xs text-dashboard-heading py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 tabular-nums"
      />
    </div>
  );
}
