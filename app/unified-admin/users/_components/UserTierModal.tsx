"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Award, Loader2 } from "lucide-react";
import { adminUsersApi } from "@/services/admin/users-api";
import type { AdminUser } from "@/types/admin/users";

const TIERS = [
  { id: "unverified-tier-id", tier: "UNVERIFIED", name: "Unverified Tier" },
  { id: "verified-tier-id", tier: "VERIFIED", name: "Verified Tier" },
  { id: "premium-tier-id", tier: "PREMIUM", name: "Premium Tier" },
];

interface Props {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

export function UserTierModal({ user, open, onClose, onUpdated }: Props) {
  const [tierId, setTierId] = useState(user.tier?.id ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!tierId || tierId === user.tier?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminUsersApi.updateTier(user.id, { tier_id: tierId, reason: reason.trim() || undefined });
      if (res.success && res.data) {
        onUpdated(res.data);
        onClose();
      } else {
        setError(res.message || "Failed to update tier");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-md p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-bold text-dashboard-heading">
            Update Tier — {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
          </h3>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">{error}</div>
        )}

        <label className="block text-xs text-dashboard-muted mb-1">New Tier</label>
        <div className="space-y-1.5 mb-3">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTierId(t.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left text-xs transition-colors ${
                tierId === t.id
                  ? "border-brand-bg-primary/40 bg-brand-bg-primary/5 text-brand-bg-primary font-medium"
                  : "border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg"
              }`}
            >
              <span>{t.name}</span>
              <span className="text-[10px] text-dashboard-muted">{t.tier}</span>
            </button>
          ))}
        </div>

        <label className="block text-xs text-dashboard-muted mb-1">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for tier change..."
          rows={2}
          className="w-full px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none mb-4"
        />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!tierId || tierId === user.tier?.id || submitting}
            className="px-4 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update Tier
          </button>
        </div>
      </motion.div>
    </div>
  );
}
