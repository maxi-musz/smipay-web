"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Lock, ScanFace, X } from "lucide-react";
import {
  IdentityGuardsApiError,
  adminIdentityGuardsApi,
} from "@/services/admin/identity-guards-api";
import type { IdentityGuardConfigResponse } from "@/types/admin/identity-guards";
import { Simulator } from "./Simulator";
import { Banner, errorMessage } from "./shared";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; config: IdentityGuardConfigResponse }
  | { status: "forbidden" }
  | { status: "error"; message: string };

async function fetchConfigState(): Promise<LoadState> {
  try {
    return { status: "ready", config: await adminIdentityGuardsApi.getConfig() };
  } catch (e) {
    return e instanceof IdentityGuardsApiError && e.status === 403
      ? { status: "forbidden" }
      : { status: "error", message: errorMessage(e, "Could not load Identity Guards") };
  }
}

export function SimulatorDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const requested = useRef(false);

  useEffect(() => {
    if (!open || requested.current) return;
    requested.current = true;
    void fetchConfigState().then(setState);
  }, [open]);

  const retry = () => {
    setState({ status: "loading" });
    void fetchConfigState().then(setState);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const config = state.status === "ready" ? state.config : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-guards-drawer-title"
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-dashboard-border/60 bg-dashboard-bg shadow-2xl animate-in slide-in-from-right duration-200"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-dashboard-border/60 bg-dashboard-surface px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg-primary">
              <ScanFace className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                id="identity-guards-drawer-title"
                className="text-base font-bold text-dashboard-heading"
              >
                Test identity guards
              </h2>
              <p className="text-xs text-dashboard-muted">
                See what a phone, email, name or BVN would get — read-only.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state.status !== "forbidden" && (
              <Link
                href="/unified-admin/identity-guards"
                className="hidden items-center gap-1 rounded-lg border border-dashboard-border/60 px-2.5 py-1.5 text-xs font-medium text-dashboard-heading hover:bg-dashboard-bg sm:inline-flex"
              >
                Open rules
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {state.status === "forbidden" ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <Lock className="h-8 w-8 text-dashboard-muted" />
              <p className="text-sm font-semibold text-dashboard-heading">No access</p>
              <p className="max-w-xs text-xs text-dashboard-muted">
                You don&apos;t have permission to use Identity Guards. Ask a
                super-admin to grant it in Management → Permissions.
              </p>
            </div>
          ) : state.status === "loading" || state.status === "idle" ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
            </div>
          ) : (
            <div className="space-y-3">
              {state.status === "error" && (
                <Banner
                  tone="warn"
                  action={
                    <button
                      type="button"
                      onClick={retry}
                      className="text-xs font-semibold underline"
                    >
                      Retry
                    </button>
                  }
                >
                  {state.message} — you can still run the simulator; modes
                  aren&apos;t shown.
                </Banner>
              )}
              {config?.migration_pending && (
                <Banner tone="info">
                  The identity_guards migration hasn&apos;t run yet — results use
                  the built-in default rules.
                </Banner>
              )}
              <Simulator
                modes={config?.modes}
                fields={config?.fields}
                bvnSandbox={config?.notes?.bvn_sandbox ?? false}
                compact
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
