"use client";

import { motion } from "motion/react";
import { RefreshCw, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  requestId?: string | null;
  loading?: boolean;
  error?: string | null;
  payload?: unknown;
}

export function RequeryVtpassModal({
  open,
  onClose,
  requestId,
  loading = false,
  error = null,
  payload,
}: Props) {
  if (!open) return null;

  const json =
    payload != null
      ? JSON.stringify(payload, null, 2)
      : loading
        ? "Loading…"
        : error
          ? ""
          : "No response";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[min(90vh,720px)] flex flex-col"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-dashboard-border/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <RefreshCw className={`h-4 w-4 text-violet-700 ${loading ? "animate-spin" : ""}`} />
              </div>
              <h3 className="text-sm font-bold text-dashboard-heading">VTPass requery</h3>
            </div>
            {requestId ? (
              <p className="text-[11px] text-dashboard-muted mt-1 font-mono truncate">
                request_id: {requestId}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto min-h-0 flex-1">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
              {error}
            </div>
          ) : null}

          <pre className="text-[11px] leading-relaxed font-mono text-dashboard-heading bg-dashboard-bg border border-dashboard-border/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {json}
          </pre>
        </div>

        <div className="px-5 py-3 border-t border-dashboard-border/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
