"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Flag, Loader2 } from "lucide-react";
import { adminTransactionsApi } from "@/services/admin/transactions-api";

interface Props {
  transactionId: string;
  open: boolean;
  onClose: () => void;
  onFlagged: () => void;
}

export function FlagTransactionModal({ transactionId, open, onClose, onFlagged }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminTransactionsApi.flag(transactionId, reason.trim());
      setReason("");
      onFlagged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to flag transaction");
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
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Flag className="h-4 w-4 text-red-600" />
          </div>
          <h3 className="text-sm font-bold text-dashboard-heading">Flag Transaction</h3>
        </div>
        <p className="text-xs text-dashboard-muted mb-4">
          Flag this transaction for compliance/fraud review. An audit log entry will be created.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
            {error}
          </div>
        )}

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for flagging..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
            className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
            Flag Transaction
          </button>
        </div>
      </motion.div>
    </div>
  );
}
