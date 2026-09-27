"use client";

import { useRef, useState, type RefObject } from "react";
import { Keyboard, Loader2, PlugZap, Waypoints } from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import type {
  GuardSurface,
  GuardSurfaceInfo,
  IdentityGuardConfigResponse,
  SurfaceKind,
  SurfaceMode,
} from "@/types/admin/identity-guards";
import {
  Banner,
  MODE_META,
  effectiveSurfaceMode,
  errorMessage,
  fieldInfo,
  modeOf,
  type GuardPerms,
} from "./shared";

const MODE_HELP: Record<SurfaceKind, Record<SurfaceMode, string>> = {
  input: {
    inherit: "Each field uses its own mode.",
    off: "Rules are skipped here. The floor still applies.",
    monitor: "Block rules only log “would block” here.",
    enforce: "Block rules stop the request here.",
  },
  provider_gate: {
    inherit: "Each field uses its own mode.",
    off: "No check before the provider call.",
    monitor: "Problems with the stored details are logged; the call goes ahead.",
    enforce:
      "The provider call is skipped or refused until the user fixes their details.",
  },
};

const MODE_LABEL: Record<SurfaceMode, string> = {
  inherit: "Inherit",
  off: MODE_META.off.label,
  monitor: MODE_META.monitor.label,
  enforce: MODE_META.enforce.label,
};

const MODE_ACTIVE: Record<SurfaceMode, string> = {
  inherit: "bg-brand-bg-primary text-white shadow-sm",
  off: MODE_META.off.active,
  monitor: MODE_META.monitor.active,
  enforce: MODE_META.enforce.active,
};

const GROUPS: {
  kind: SurfaceKind;
  title: string;
  help: string;
  icon: typeof Keyboard;
}[] = [
  {
    kind: "input",
    title: "Where users enter details",
    help: "Rules run on what the user types at each of these points.",
    icon: Keyboard,
  },
  {
    kind: "provider_gate",
    title: "Before paying a provider",
    help: "Checks the name, phone and email already on the account before we ask a provider to create a customer or account for it. Monitor only logs; Enforce skips or refuses the provider call.",
    icon: PlugZap,
  },
];

export function SurfacesPanel({
  config,
  perms,
  onConfigSaved,
  saveLock,
  busyElsewhere = false,
  onBusyChange,
}: {
  config: IdentityGuardConfigResponse;
  perms: GuardPerms;
  onConfigSaved: (next: IdentityGuardConfigResponse) => void;
  saveLock?: RefObject<boolean>;
  busyElsewhere?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [saving, setSaving] = useState<GuardSurface | null>(null);
  const [pendingOff, setPendingOff] = useState<GuardSurface | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const ownLock = useRef(false);
  const inFlight = saveLock ?? ownLock;

  const surfaces = config.surfaces ?? [];
  if (surfaces.length === 0) return null;

  const migrationPending = config.surfaces_migration_pending === true;
  const canChange = perms.canUpdate && !perms.locked && !migrationPending;

  const save = async (surface: GuardSurfaceInfo, next: SurfaceMode) => {
    if (inFlight.current) return;
    inFlight.current = true;
    onBusyChange?.(true);
    setSaving(surface.key);
    setError(null);
    setNotice(null);
    try {
      onConfigSaved(
        await adminIdentityGuardsApi.updateSurfaces({ [surface.key]: next }),
      );
      setNotice(`${surface.label} is now ${MODE_LABEL[next]}.`);
    } catch (e) {
      setError(errorMessage(e, "Could not change where guards run"));
    } finally {
      inFlight.current = false;
      onBusyChange?.(false);
      setSaving(null);
      setPendingOff(null);
    }
  };

  const request = (surface: GuardSurfaceInfo, next: SurfaceMode) => {
    if (next === "off") {
      setPendingOff(surface.key);
      return;
    }
    setPendingOff(null);
    void save(surface, next);
  };

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <header className="flex items-start gap-3 border-b border-dashboard-border/60 px-4 py-3.5 sm:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg">
          <Waypoints className="h-4 w-4 text-dashboard-heading" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-dashboard-heading">
            Where guards run
          </h2>
          <p className="text-xs text-dashboard-muted">
            <strong className="font-semibold">Inherit</strong> follows each
            field&apos;s mode above. Off, Monitor or Enforce here overrides it
            for that place only. A field that is Off stays off everywhere.
          </p>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {migrationPending && (
          <Banner tone="warn">
            <strong>Run migration 20260927090000</strong> to manage where
            guards run. Until then every place below runs on its default and
            can&apos;t be changed.
          </Banner>
        )}
        {error && (
          <Banner tone="error" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}
        {notice && (
          <Banner tone="success" onDismiss={() => setNotice(null)}>
            {notice}
          </Banner>
        )}

        {GROUPS.map((group) => {
          const rows = surfaces.filter((s) => s.kind === group.kind);
          if (rows.length === 0) return null;
          return (
            <div key={group.kind} className="space-y-2">
              <div className="flex items-start gap-2">
                <group.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dashboard-muted" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-dashboard-heading">
                    {group.title}
                  </p>
                  <p className="text-[11px] leading-relaxed text-dashboard-muted">
                    {group.help}
                  </p>
                </div>
              </div>

              <ul className="divide-y divide-dashboard-border/40 rounded-lg border border-dashboard-border/60">
                {rows.map((surface) => (
                  <SurfaceRow
                    key={surface.key}
                    surface={surface}
                    config={config}
                    readOnly={!canChange}
                    disabled={!canChange || saving !== null || busyElsewhere}
                    busy={saving === surface.key}
                    confirmingOff={pendingOff === surface.key}
                    onChange={(next) => request(surface, next)}
                    onConfirmOff={() => save(surface, "off")}
                    onCancelOff={() => setPendingOff(null)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SurfaceRow({
  surface,
  config,
  readOnly,
  disabled,
  busy,
  confirmingOff,
  onChange,
  onConfirmOff,
  onCancelOff,
}: {
  surface: GuardSurfaceInfo;
  config: IdentityGuardConfigResponse;
  readOnly: boolean;
  disabled: boolean;
  busy: boolean;
  confirmingOff: boolean;
  onChange: (next: SurfaceMode) => void;
  onConfirmOff: () => void;
  onCancelOff: () => void;
}) {
  const help = MODE_HELP[surface.kind] ?? MODE_HELP.input;
  const isDefault = surface.mode === surface.default_mode;

  return (
    <li className="space-y-2 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-dashboard-heading">
            {surface.label}
          </p>
          {surface.description && (
            <p className="text-[11px] leading-relaxed text-dashboard-muted">
              {surface.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {busy && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-dashboard-muted" />
          )}
          <div
            role="radiogroup"
            aria-label={`${surface.label} mode`}
            className={`inline-flex rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5 ${
              busy ? "opacity-60" : ""
            }`}
          >
            {surface.allowed_modes.map((m) => {
              const active = surface.mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  title={`${help[m]}${surface.default_mode === m ? " (default)" : ""}`}
                  onClick={() => !active && onChange(m)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                    active
                      ? MODE_ACTIVE[m]
                      : "text-dashboard-muted hover:text-dashboard-heading disabled:hover:text-dashboard-muted"
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {surface.fields.map((f) => {
          const effective = effectiveSurfaceMode(
            surface.mode,
            modeOf(config, f),
          );
          return (
            <span
              key={f}
              title={MODE_META[effective].help}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashboard-border/60 bg-dashboard-bg px-1.5 py-0.5 text-[11px] text-dashboard-heading"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${MODE_META[effective].dot}`}
              />
              {fieldInfo(config.fields, f).label}
              <span className="text-dashboard-muted">
                {MODE_META[effective].label}
              </span>
            </span>
          );
        })}
        <span className="text-[11px] text-dashboard-muted">
          {help[surface.mode]}
          {!isDefault && (
            <>
              {" "}
              Default: {MODE_LABEL[surface.default_mode]}.{" "}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onChange(surface.default_mode)}
                  disabled={disabled}
                  className="font-semibold text-brand-bg-primary hover:underline disabled:opacity-50"
                >
                  Use default
                </button>
              )}
            </>
          )}
        </span>
      </div>

      {confirmingOff && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <p>
            <strong>Turn {surface.label} off?</strong>{" "}
            {surface.kind === "provider_gate"
              ? "Provider calls here go ahead with whatever details are stored, and nothing is logged."
              : "Rules stop running here and nothing is logged. The floor still applies."}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onConfirmOff}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              Turn off
            </button>
            <button
              type="button"
              onClick={onCancelOff}
              disabled={busy}
              className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
