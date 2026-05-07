"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Loader2, Settings } from "lucide-react";
import { adminReferralsApi } from "@/services/admin/referrals-api";
import { REWARD_TRIGGERS } from "@/types/admin/referrals";
import type { ReferralConfig, ReferralConfigPayload } from "@/types/admin/referrals";

interface ReferralConfigModalProps {
  config: ReferralConfig;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ReferralConfigModal({ config, open, onClose, onSaved }: ReferralConfigModalProps) {
  const [form, setForm] = useState<ReferralConfigPayload>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        is_active: config.is_active,
        referrer_reward_amount: config.referrer_reward,
        referee_reward_amount: config.referee_reward,
        reward_trigger: config.reward_trigger,
        max_referrals_per_user: config.max_per_user,
        referral_expiry_days: config.expiry_days,
        min_transaction_amount: config.min_tx_amount,
      });
      setError("");
    }
  }, [open, config]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await adminReferralsApi.updateConfig(form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-lg"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-border/60">
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-brand-bg-primary" />
            <h2 className="text-sm font-bold text-dashboard-heading">Referral Program Settings</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-dashboard-bg text-dashboard-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          {/* Program active toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-dashboard-heading">Program Active</label>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.is_active ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  form.is_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Referrer Reward (₦)"
              value={form.referrer_reward_amount}
              onChange={(v) => setForm((p) => ({ ...p, referrer_reward_amount: v }))}
            />
            <NumberField
              label="Referee Reward (₦)"
              value={form.referee_reward_amount}
              onChange={(v) => setForm((p) => ({ ...p, referee_reward_amount: v }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-dashboard-muted mb-1.5">Reward Trigger</label>
            <select
              value={form.reward_trigger ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, reward_trigger: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 appearance-none"
            >
              {REWARD_TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NumberField
              label="Max / User"
              value={form.max_referrals_per_user}
              onChange={(v) => setForm((p) => ({ ...p, max_referrals_per_user: v }))}
            />
            <NumberField
              label="Expiry (days)"
              value={form.referral_expiry_days}
              onChange={(v) => setForm((p) => ({ ...p, referral_expiry_days: v }))}
            />
            <NumberField
              label="Min Tx (₦)"
              value={form.min_transaction_amount}
              onChange={(v) => setForm((p) => ({ ...p, min_transaction_amount: v }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-dashboard-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-dashboard-muted mb-1.5">{label}</label>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
      />
    </div>
  );
}
