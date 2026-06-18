"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Smartphone,
  Apple,
  RefreshCw,
  Save,
  Loader2,
  Power,
  AlertTriangle,
  Check,
  Info,
  ShieldAlert,
  Bell,
  Link2,
  PackageCheck,
} from "lucide-react";
import { useAdminAppVersion } from "@/hooks/admin/useAdminAppVersion";
import { adminAppVersionApi } from "@/services/admin/app-version-api";
import type {
  AppVersionGateConfig,
  AppVersionGateConfigPayload,
} from "@/types/admin/app-version";

const SEMVER = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export default function AppVersionSettingsPage() {
  const { config, configLoading, configError, refetchConfig } =
    useAdminAppVersion();

  const isInitialLoad = configLoading && !config;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                App Version Control
              </h1>
              <p className="text-xs text-dashboard-muted">
                Patch force / soft update prompts without rebuilding the app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetchConfig}
            disabled={configLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${configLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4 max-w-5xl">
        {configError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
          >
            {configError}
            <button
              type="button"
              onClick={refetchConfig}
              className="ml-2 underline font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {isInitialLoad ? (
          <AppVersionSkeleton />
        ) : config ? (
          <AppVersionForm config={config} onSaved={refetchConfig} />
        ) : (
          !configError && (
            <div className="text-center py-16 text-sm text-dashboard-muted">
              Unable to load app version config
            </div>
          )
        )}
      </div>
    </div>
  );
}

function AppVersionForm({
  config,
  onSaved,
}: {
  config: AppVersionGateConfig;
  onSaved: () => void;
}) {
  const buildForm = (c: AppVersionGateConfig) => ({
    min_version_ios: c.min_version_ios,
    min_version_android: c.min_version_android,
    latest_version_ios: c.latest_version_ios,
    latest_version_android: c.latest_version_android,
    latest_build_ios: c.latest_build_ios ?? "",
    latest_build_android: c.latest_build_android ?? "",
    ios_store_url: c.ios_store_url,
    android_store_url: c.android_store_url,
    force_message: c.force_message,
    soft_message: c.soft_message,
  });

  const [form, setForm] = useState(buildForm(config));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState(false);

  useEffect(() => {
    setForm(buildForm(config));
  }, [config]);

  const set = (patch: Partial<typeof form>) =>
    setForm((p) => ({ ...p, ...patch }));

  const versionFields = [
    "min_version_ios",
    "min_version_android",
    "latest_version_ios",
    "latest_version_android",
  ] as const;

  const invalidVersions = versionFields.filter(
    (k) => !SEMVER.test(form[k].trim()),
  );

  const dirty =
    form.min_version_ios !== config.min_version_ios ||
    form.min_version_android !== config.min_version_android ||
    form.latest_version_ios !== config.latest_version_ios ||
    form.latest_version_android !== config.latest_version_android ||
    form.latest_build_ios !== (config.latest_build_ios ?? "") ||
    form.latest_build_android !== (config.latest_build_android ?? "") ||
    form.ios_store_url !== config.ios_store_url ||
    form.android_store_url !== config.android_store_url ||
    form.force_message !== config.force_message ||
    form.soft_message !== config.soft_message;

  const handleSave = async () => {
    if (invalidVersions.length > 0) {
      setError("Versions must be valid semver (e.g. 2.1.0)");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload: AppVersionGateConfigPayload = {};
      if (form.min_version_ios !== config.min_version_ios)
        payload.min_version_ios = form.min_version_ios.trim();
      if (form.min_version_android !== config.min_version_android)
        payload.min_version_android = form.min_version_android.trim();
      if (form.latest_version_ios !== config.latest_version_ios)
        payload.latest_version_ios = form.latest_version_ios.trim();
      if (form.latest_version_android !== config.latest_version_android)
        payload.latest_version_android = form.latest_version_android.trim();
      if (form.latest_build_ios !== (config.latest_build_ios ?? ""))
        payload.latest_build_ios = form.latest_build_ios.trim() || null;
      if (form.latest_build_android !== (config.latest_build_android ?? ""))
        payload.latest_build_android = form.latest_build_android.trim() || null;
      if (form.ios_store_url !== config.ios_store_url)
        payload.ios_store_url = form.ios_store_url.trim();
      if (form.android_store_url !== config.android_store_url)
        payload.android_store_url = form.android_store_url.trim();
      if (form.force_message !== config.force_message)
        payload.force_message = form.force_message;
      if (form.soft_message !== config.soft_message)
        payload.soft_message = form.soft_message;

      if (Object.keys(payload).length === 0) return;
      await adminAppVersionApi.updateConfig(payload);
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
      await adminAppVersionApi.updateConfig({ is_active: !config.is_active });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle gate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Live "what users see" summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <PlatformSummaryCard
          platform="iOS"
          icon={<Apple className="h-4 w-4" />}
          latestVersion={config.latest_version_ios}
          minVersion={config.min_version_ios}
          build={config.latest_build_ios}
          active={config.is_active}
        />
        <PlatformSummaryCard
          platform="Android"
          icon={<Smartphone className="h-4 w-4" />}
          latestVersion={config.latest_version_android}
          minVersion={config.min_version_android}
          build={config.latest_build_android}
          active={config.is_active}
        />
      </motion.div>

      {/* Master toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${config.is_active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
            >
              <Power className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dashboard-heading">
                Version Gate Enforcement
              </p>
              <p className="text-[11px] text-dashboard-muted">
                {config.is_active
                  ? "Active — users on outdated builds see update prompts"
                  : "Disabled — every build passes, no prompts are shown (kill switch)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToggleConfirm(true)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${config.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
            aria-label="Toggle version gate enforcement"
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${config.is_active ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Version numbers */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-4"
      >
        <SectionTitle
          icon={<PackageCheck className="h-3.5 w-3.5" />}
          title="Version Numbers"
          subtitle="Plain semver (x.y.z). Must match the build's user-facing version in app.json."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4 mt-3">
          <PlatformColumn
            title="iOS"
            icon={<Apple className="h-4 w-4 text-dashboard-muted" />}
          >
            <VersionInput
              label="Minimum supported version"
              help="Builds below this are FORCED to update (no dismiss)"
              value={form.min_version_ios}
              onChange={(v) => set({ min_version_ios: v })}
              tone="force"
            />
            <VersionInput
              label="Latest version"
              help="Builds below this get a dismissable soft nudge"
              value={form.latest_version_ios}
              onChange={(v) => set({ latest_version_ios: v })}
              tone="soft"
            />
            <TextInput
              label="Latest build number"
              help="Informational only — shown here, not used for gating"
              placeholder="e.g. 42"
              value={form.latest_build_ios}
              onChange={(v) => set({ latest_build_ios: v })}
            />
          </PlatformColumn>

          <PlatformColumn
            title="Android"
            icon={<Smartphone className="h-4 w-4 text-dashboard-muted" />}
          >
            <VersionInput
              label="Minimum supported version"
              help="Builds below this are FORCED to update (no dismiss)"
              value={form.min_version_android}
              onChange={(v) => set({ min_version_android: v })}
              tone="force"
            />
            <VersionInput
              label="Latest version"
              help="Builds below this get a dismissable soft nudge"
              value={form.latest_version_android}
              onChange={(v) => set({ latest_version_android: v })}
              tone="soft"
            />
            <TextInput
              label="Latest build number"
              help="Informational only — shown here, not used for gating"
              placeholder="e.g. 57"
              value={form.latest_build_android}
              onChange={(v) => set({ latest_build_android: v })}
            />
          </PlatformColumn>
        </div>
      </motion.div>

      {/* Store URLs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-4"
      >
        <SectionTitle
          icon={<Link2 className="h-3.5 w-3.5" />}
          title="Store Links"
          subtitle="Opened by the 'Update now' button in the prompt."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          <TextInput
            label="iOS App Store URL"
            value={form.ios_store_url}
            onChange={(v) => set({ ios_store_url: v })}
            placeholder="https://apps.apple.com/..."
          />
          <TextInput
            label="Android Play Store URL"
            value={form.android_store_url}
            onChange={(v) => set({ android_store_url: v })}
            placeholder="https://play.google.com/..."
          />
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-4"
      >
        <SectionTitle
          icon={<Bell className="h-3.5 w-3.5" />}
          title="Prompt Messages"
          subtitle="Body copy shown inside each update modal. Edit per release."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          <TextArea
            label="Force-update message"
            icon={<ShieldAlert className="h-3.5 w-3.5 text-red-500" />}
            value={form.force_message}
            onChange={(v) => set({ force_message: v })}
            placeholder="We've shipped important fixes. Please update to continue."
          />
          <TextArea
            label="Soft-update message"
            icon={<Bell className="h-3.5 w-3.5 text-amber-500" />}
            value={form.soft_message}
            onChange={(v) => set({ soft_message: v })}
            placeholder="A new version of SmiPay is available with improvements."
          />
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3"
      >
        <div className="flex gap-2.5">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-blue-900 space-y-1">
            <p>
              <span className="font-semibold">How gating works:</span> the app
              reads its installed version on launch and compares it per
              platform.
            </p>
            <p>
              • <span className="font-semibold">Below minimum</span> → forced
              update (cannot dismiss). •{" "}
              <span className="font-semibold">
                Below latest but above minimum
              </span>{" "}
              → soft nudge (dismissable, snoozes 24h). •{" "}
              <span className="font-semibold">At or above latest</span> → no
              prompt.
            </p>
            <p>
              Changes here take effect on the next app launch or foreground — no
              rebuild needed. Set both numbers to{" "}
              <span className="font-mono">0.0.0</span> (or flip the toggle off)
              to disarm all prompts.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Save bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="flex flex-wrap items-center gap-3"
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving || invalidVersions.length > 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Changes
        </button>
        {dirty && !saving && (
          <span className="text-[11px] text-amber-600 font-medium">
            Unsaved changes
          </span>
        )}
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
          {config.updated_by ? ` · by ${config.updated_by}` : ""}
        </p>
      )}

      {/* Toggle confirm dialog */}
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
                    {config.is_active ? "Disable" : "Enable"} version gate
                  </h3>
                  <p className="text-xs text-dashboard-muted">
                    {config.is_active
                      ? "All update prompts will stop immediately. Users on any build can use the app."
                      : "Outdated builds will start seeing the configured update prompts again."}
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

/* ---------- presentational helpers ---------- */

function PlatformSummaryCard({
  platform,
  icon,
  latestVersion,
  minVersion,
  build,
  active,
}: {
  platform: string;
  icon: React.ReactNode;
  latestVersion: string;
  minVersion: string;
  build: string | null;
  active: boolean;
}) {
  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-dashboard-heading">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wide">
            {platform}
          </span>
        </div>
        <span
          className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
        >
          {active ? "Gate on" : "Gate off"}
        </span>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium text-dashboard-muted">
            Current version live to users
          </p>
          <p className="text-2xl font-bold tabular-nums leading-tight text-dashboard-heading">
            {latestVersion}
            {build ? (
              <span className="text-xs font-medium text-dashboard-muted ml-1.5">
                (build {build})
              </span>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium text-dashboard-muted">
            Min required
          </p>
          <p className="text-sm font-semibold tabular-nums text-dashboard-heading">
            {minVersion}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="h-6 w-6 rounded-md bg-dashboard-bg flex items-center justify-center text-dashboard-muted shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-xs font-bold text-dashboard-heading">{title}</h3>
        <p className="text-[10px] text-dashboard-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function PlatformColumn({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1.5 border-b border-dashboard-border/50">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wide text-dashboard-heading">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function VersionInput({
  label,
  help,
  value,
  onChange,
  tone,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
  tone: "force" | "soft";
}) {
  const valid = SEMVER.test(value.trim());
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[10px] font-semibold text-dashboard-muted">
          {label}
        </label>
        <span
          className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${tone === "force" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}
        >
          {tone === "force" ? "Force" : "Soft"}
        </span>
      </div>
      <input
        type="text"
        value={value}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-dashboard-bg border rounded-lg text-sm font-mono tabular-nums text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 ${
          valid
            ? "border-dashboard-border/60 focus:ring-brand-bg-primary/20"
            : "border-red-300 focus:ring-red-200"
        }`}
      />
      <p
        className={`text-[9px] mt-0.5 ${valid ? "text-dashboard-muted" : "text-red-500"}`}
      >
        {valid ? help : "Enter a valid semver, e.g. 2.1.0"}
      </p>
    </div>
  );
}

function TextInput({
  label,
  help,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-dashboard-muted mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 placeholder:text-dashboard-muted/50"
      />
      {help && (
        <p className="text-[9px] text-dashboard-muted mt-0.5">{help}</p>
      )}
    </div>
  );
}

function TextArea({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-dashboard-muted mb-1">
        {icon}
        {label}
      </label>
      <textarea
        value={value}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 placeholder:text-dashboard-muted/50 resize-none"
      />
      <p className="text-[9px] text-dashboard-muted mt-0.5">
        {value.length}/280 characters
      </p>
    </div>
  );
}

function AppVersionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-28 rounded-xl bg-dashboard-surface border border-dashboard-border/60" />
        <div className="h-28 rounded-xl bg-dashboard-surface border border-dashboard-border/60" />
      </div>
      <div className="h-16 rounded-xl bg-dashboard-surface border border-dashboard-border/60" />
      <div className="h-64 rounded-xl bg-dashboard-surface border border-dashboard-border/60" />
      <div className="h-32 rounded-xl bg-dashboard-surface border border-dashboard-border/60" />
    </div>
  );
}
