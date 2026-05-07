"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flag, X } from "lucide-react";

interface FlagAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function FlagAuditModal({
  isOpen,
  onClose,
  description,
  onConfirm,
}: FlagAuditModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim() || loading) return;
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-full sm:max-w-md mx-4 bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Flag className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Flag Audit Log
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-dashboard-muted hover:text-dashboard-heading transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 space-y-3.5">
              <p className="text-xs text-dashboard-muted leading-relaxed">
                You are flagging:{" "}
                <span className="font-medium text-dashboard-heading">
                  {description}
                </span>
              </p>

              <div>
                <label className="text-[11px] font-medium text-dashboard-muted block mb-1.5">
                  Reason for flagging
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why this log entry should be flagged for review..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm rounded-lg bg-dashboard-bg border border-dashboard-border/60 text-dashboard-heading placeholder:text-dashboard-muted outline-none focus:ring-1 focus:ring-red-500/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-dashboard-bg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-surface transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!reason.trim() || loading}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {loading ? (
                    <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Flag className="h-3 w-3" />
                  )}
                  {loading ? "Flagging…" : "Flag"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
