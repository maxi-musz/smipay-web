"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { UserCog, Loader2 } from "lucide-react";
import { adminUsersApi } from "@/services/admin/users-api";
import { USER_ROLES } from "@/types/admin/users";
import type { AdminUser } from "@/types/admin/users";

interface Props {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

export function UserRoleModal({ user, open, onClose, onUpdated }: Props) {
  const [role, setRole] = useState(user.role);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (role === user.role) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminUsersApi.updateRole(user.id, { role, reason: reason.trim() || undefined });
      if (res.success && res.data) {
        onUpdated(res.data);
        onClose();
      } else {
        setError(res.message || "Failed to update role");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
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
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <UserCog className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-dashboard-heading">
            Edit Role — {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
          </h3>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">{error}</div>
        )}

        <label className="block text-xs text-dashboard-muted mb-1">New Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 mb-3"
        >
          {USER_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <label className="block text-xs text-dashboard-muted mb-1">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for role change..."
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
            disabled={role === user.role || submitting}
            className="px-4 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update Role
          </button>
        </div>
      </motion.div>
    </div>
  );
}
