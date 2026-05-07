"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Save, Loader2, Power, AlertTriangle, Check } from "lucide-react";
import { adminFirstTxRewardApi } from "@/services/admin/first-tx-reward-api";
import type {
  FirstTxRewardConfig,
  FirstTxRewardStats,
  FirstTxRewardConfigPayload,
} from "@/types/admin/first-tx-reward";
import { FIRST_TX_TRANSACTION_TYPES } from "@/types/admin/first-tx-reward";

interface FirstTxRewardSettingsProps {
  config: FirstTxRewardConfig;
  stats: FirstTxRewardStats | null;
  onSaved: () => void;
}

function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function toLocalDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function fromLocalDate(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

export function FirstTxRewardSettings({
  config,
  stats,
  onSaved,
}: FirstTxRewardSettingsProps) {
  const [form, setForm] = useState({
    reward_amount: config.reward_amount,
    min_transaction_amount: config.min_transaction_amount,
    eligible_transaction_types: [...config.eligible_transaction_types],
    budget_limit: config.budget_limit,
    max_recipients: config.max_recipients,
    start_date: config.start_date,
    end_date: config.end_date,
    require_kyc: config.require_kyc,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState(false);

  useEffect(() => {
    setForm({
      reward_amount: config.reward_amount,
      min_transaction_amount: config.min_transaction_amount,
      eligible_transaction_types: [...config.eligible_transaction_types],
      budget_limit: config.budget_limit,
      max_recipients: config.max_recipients,
      start_date: config.start_date,
      end_date: config.end_date,
      require_kyc: config.require_kyc,
    });
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload: FirstTxRewardConfigPayload = {};
      if (form.reward_amount !== config.reward_amount)
        payload.reward_amount = form.reward_amount;
      if (form.min_transaction_amount !== config.min_transaction_amount)
        payload.min_transaction_amount = form.min_transaction_amount;
      if (form.require_kyc !== config.require_kyc)
        payload.require_kyc = form.require_kyc;

      const origTypes = [...config.eligible_transaction_types].sort().join(",");
      const newTypes = [...form.eligible_transaction_types].sort().join(",");
      if (origTypes !== newTypes)
        payload.eligible_transaction_types = form.eligible_transaction_types;

      if (form.budget_limit !== config.budget_limit)
        payload.budget_limit = form.budget_limit;
      if (form.max_recipients !== config.max_recipients)
        payload.max_recipients = form.max_recipients;
      if (form.start_date !== config.start_date)
        payload.start_date = form.start_date;
      if (form.end_date !== config.end_date) payload.end_date = form.end_date;

      if (Object.keys(payload).length === 0) return;
      await adminFirstTxRewardApi.updateConfig(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setToggleConfirm(false);
    setSaving(true);
    setError(null);
    try {
      await adminFirstTxRewardApi.updateConfig({
        is_active: !config.is_active,
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle program",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleTxType = (type: string) => {
    setForm((prev) => {
      const has = prev.eligible_transaction_types.includes(type);
      return {
        ...prev,
        eligible_transaction_types: has
          ? prev.eligible_transaction_types.filter((t) => t !== type)
          : [...prev.eligible_transaction_types, type],
      };
    });
  };

  const dirty =
    form.reward_amount !== config.reward_amount ||
    form.min_transaction_amount !== config.min_transaction_amount ||
    form.require_kyc !== config.require_kyc ||
    form.budget_limit !== config.budget_limit ||
    form.max_recipients !== config.max_recipients ||
    form.start_date !== config.start_date ||
    form.end_date !== config.end_date ||
    [...form.eligible_transaction_types].sort().join(",") !==
      [...config.eligible_transaction_types].sort().join(",");

  return (
    <div className="space-y-4">
      {/* Live Stats Banner */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
        >
          <MiniStat
            label="Total Recipients"
            value={stats.total_recipients.toLocaleString()}
          />
          <MiniStat
            label="Total Given"
            value={formatCurrency(stats.total_given)}
          />
          <MiniStat
            label="Budget Remaining"
            value={
              stats.budget_remaining !== null
                ? formatCurrency(stats.budget_remaining)
                : "Unlimited"
            }
          />
          <MiniStat
            label="Recipient Slots"
            value={
              stats.recipient_slots_remaining !== null
                ? stats.recipient_slots_remaining.toLocaleString()
                : "Unlimited"
            }
          />
        </motion.div>
      )}

      {/* Master Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
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
                First Transaction Reward
              </p>
              <p className="text-[11px] text-dashboard-muted">
                {config.is_active
                  ? "Active — new users earn a bonus on their first qualifying transaction"
                  : "Inactive — no first-tx bonuses are being given"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToggleConfirm(true)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${config.is_active ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </motion.div>

      {/* Reward Settings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3"
      >
        <h3 className="text-xs font-bold text-dashboard-heading mb-3">
          Reward Settings
        </h3>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Reward Amount"
            value={form.reward_amount}
            onChange={(v) => setForm((p) => ({ ...p, reward_amount: v }))}
            prefix="₦"
            helpText="Credited to user's wallet instantly"
          />
          <NumberInput
            label="Min Purchase Amount"
            value={form.min_transaction_amount}
            onChange={(v) =>
              setForm((p) => ({ ...p, min_transaction_amount: v }))
            }
            prefix="₦"
            helpText="First tx must be at least this amount"
          />
        </div>
      </motion.div>

      {/* Eligible Transaction Types */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3"
      >
        <h3 className="text-xs font-bold text-dashboard-heading mb-1">
          Eligible Transaction Types
        </h3>
        <p className="text-[10px] text-dashboard-muted mb-3">
          Which transaction types count as a qualifying first transaction
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FIRST_TX_TRANSACTION_TYPES.map((type) => {
            const checked = form.eligible_transaction_types.includes(
              type.value,
            );
            return (
              <label
                key={type.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? "border-brand-bg-primary/40 bg-brand-bg-primary/5"
                    : "border-dashboard-border/60 hover:bg-dashboard-bg"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTxType(type.value)}
                  className="accent-brand-bg-primary"
                />
                <span className="text-xs font-medium text-dashboard-heading">
                  {type.label}
                </span>
              </label>
            );
          })}
        </div>
      </motion.div>

      {/* Campaign Limits */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3"
      >
        <h3 className="text-xs font-bold text-dashboard-heading mb-1">
          Campaign Limits
        </h3>
        <p className="text-[10px] text-dashboard-muted mb-3">
          All optional — leave empty for no limit
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NullableNumberInput
            label="Budget Limit"
            value={form.budget_limit}
            onChange={(v) => setForm((p) => ({ ...p, budget_limit: v }))}
            prefix="₦"
            placeholder="No limit"
            helpText="Stop giving rewards when total hits this amount"
          />
          <NullableNumberInput
            label="Max Recipients"
            value={form.max_recipients}
            onChange={(v) => setForm((p) => ({ ...p, max_recipients: v }))}
            placeholder="Unlimited"
            helpText="First N users only — then stop"
          />
        </div>

        <h4 className="text-[11px] font-semibold text-dashboard-heading mt-4 mb-1">
          Campaign Window
        </h4>
        <p className="text-[10px] text-dashboard-muted mb-2">
          Leave empty for always-on
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={toLocalDate(form.start_date)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  start_date: fromLocalDate(e.target.value),
                }))
              }
              className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
              End Date
            </label>
            <input
              type="date"
              value={toLocalDate(form.end_date)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  end_date: fromLocalDate(e.target.value),
                }))
              }
              className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          </div>
        </div>
        {(form.start_date || form.end_date) && (
          <button
            type="button"
            onClick={() =>
              setForm((p) => ({ ...p, start_date: null, end_date: null }))
            }
            className="mt-2 text-[10px] text-red-600 hover:underline"
          >
            Clear date window
          </button>
        )}
      </motion.div>

      {/* KYC Requirement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-dashboard-heading">
              Require KYC Verification
            </p>
            <p className="text-[10px] text-dashboard-muted">
              {form.require_kyc
                ? "User must be KYC-verified to receive the bonus"
                : "Any user qualifies regardless of KYC status"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, require_kyc: !p.require_kyc }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.require_kyc ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.require_kyc ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Changes
        </button>
        <AnimatePresence>
          {success && (
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
      </motion.div>

      {config.updatedAt && (
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
      )}

      {/* Toggle Confirmation Dialog */}
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
                    {config.is_active ? "Disable" : "Enable"} First Tx Reward
                  </h3>
                  <p className="text-xs text-dashboard-muted">
                    {config.is_active
                      ? "New users will stop receiving the first-transaction bonus."
                      : "New users will start receiving a bonus on their first qualifying transaction."}
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
                  onClick={handleToggle}
                  className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors ${config.is_active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {config.is_active ? "Turn Off" : "Turn On"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3">
      <p className="text-[11px] font-medium text-dashboard-muted truncate">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums leading-tight text-dashboard-heading mt-0.5">
        {value}
      </p>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  helpText,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  helpText?: string;
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
          min={0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 ${prefix ? "pl-7 pr-2.5" : "px-2.5"}`}
        />
      </div>
      {helpText && (
        <p className="text-[9px] text-dashboard-muted mt-0.5">{helpText}</p>
      )}
    </div>
  );
}

function NullableNumberInput({
  label,
  value,
  onChange,
  prefix,
  placeholder,
  helpText,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  placeholder?: string;
  helpText?: string;
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
          value={value ?? ""}
          min={0}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
          className={`w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 placeholder:text-dashboard-muted/50 ${prefix ? "pl-7 pr-2.5" : "px-2.5"}`}
        />
      </div>
      {helpText && (
        <p className="text-[9px] text-dashboard-muted mt-0.5">{helpText}</p>
      )}
    </div>
  );
}
