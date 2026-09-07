"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Fingerprint, Loader2, Save, AlertTriangle } from "lucide-react";
import { adminBvnConfigApi } from "@/services/admin/bvn-config-api";
import { usePermissions } from "@/hooks/admin/useAdminPermissions";
import type {
  BvnConfigField,
  BvnConfigGroup,
  BvnConfigValues,
  BvnCredentialStatus,
} from "@/types/admin/bvn";

/**
 * KYC → BVN Verification. The whole form is rendered from the field catalogue
 * the API returns, so a new backend knob appears here with no frontend change.
 */
export function BvnVerificationPanel({
  onProviderConfigured,
}: {
  onProviderConfigured?: (configured: boolean) => void;
} = {}) {
  const { can, isSuperAdmin } = usePermissions();
  const canEdit = isSuperAdmin || can("kyc-providers", "update");

  const [groups, setGroups] = useState<BvnConfigGroup[]>([]);
  const [values, setValues] = useState<BvnConfigValues>({});
  const [baseline, setBaseline] = useState<BvnConfigValues>({});
  const [credentials, setCredentials] = useState<BvnCredentialStatus | null>(
    null,
  );
  // Write-only credential edits. `undefined` = untouched.
  const [appIdEdit, setAppIdEdit] = useState<string | undefined>(undefined);
  const [secretEdit, setSecretEdit] = useState<string | undefined>(undefined);
  const [providerConfigured, setProviderConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminBvnConfigApi.getConfig();
      if (res.success && res.data) {
        setGroups(res.data.groups);
        setValues(res.data.config);
        setBaseline(res.data.config);
        setCredentials(res.data.credentials);
        setProviderConfigured(res.data.provider_configured);
        onProviderConfigured?.(res.data.provider_configured);
        setAppIdEdit(undefined);
        setSecretEdit(undefined);
      } else {
        setError(res.message || "Failed to load BVN config");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load BVN config");
    } finally {
      setLoading(false);
    }
  }, [onProviderConfigured]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (key: string, value: string | number | boolean) => {
    setValues((v) => ({ ...v, [key]: value }));
    setNotice(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload: BvnConfigValues & Record<string, unknown> = { ...values };
      if (appIdEdit !== undefined) payload.dojah_app_id = appIdEdit;
      if (secretEdit !== undefined && secretEdit !== "")
        payload.dojah_secret_key = secretEdit;
      const res = await adminBvnConfigApi.updateConfig(payload);
      if (res.success && res.data) {
        setValues(res.data.config);
        setBaseline(res.data.config);
        setCredentials(res.data.credentials);
        setProviderConfigured(res.data.provider_configured);
        onProviderConfigured?.(res.data.provider_configured);
        setAppIdEdit(undefined);
        setSecretEdit(undefined);
        setNotice("Saved.");
      } else {
        setError(res.message || "Failed to save");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const configDirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const credsDirty =
    appIdEdit !== undefined || (secretEdit !== undefined && secretEdit !== "");
  const dirty = configDirty || credsDirty;

  const enabled = Boolean(values.enabled);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashboard-border/60 bg-dashboard-surface py-16">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-muted" />
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
      <header className="flex items-center gap-3 border-b border-dashboard-border/60 px-4 py-3.5 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-bg-primary">
          <Fingerprint className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-dashboard-heading">
            BVN Verification
          </h2>
          <p className="text-xs text-dashboard-muted">
            Verify users against the phone registered to their BVN. When off,
            users are never prompted.
          </p>
        </div>
      </header>

      <div className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {enabled && !providerConfigured && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              BVN verification is on, but no Dojah credentials are configured.
              Add the App ID and secret key below — requests will fail until you
              do.
            </span>
          </div>
        )}

        <BvnCredentialsCard
          credentials={credentials}
          appIdEdit={appIdEdit}
          secretEdit={secretEdit}
          disabled={!canEdit}
          onAppId={(v) => {
            setAppIdEdit(v);
            setNotice(null);
          }}
          onSecret={(v) => {
            setSecretEdit(v);
            setNotice(null);
          }}
        />

        {groups.map((group) => (
          <BvnGroup
            key={group.key}
            group={group}
            values={values}
            disabled={!canEdit}
            onChange={setField}
          />
        ))}

        <div className="flex items-center justify-end gap-3 border-t border-dashboard-border/60 pt-4">
          {notice && <span className="text-xs text-green-600">{notice}</span>}
          <button
            type="button"
            onClick={save}
            disabled={!canEdit || saving || !dirty}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </button>
        </div>
        {!canEdit && (
          <p className="text-right text-xs text-dashboard-muted">
            You have read-only access to KYC settings.
          </p>
        )}
      </div>
    </section>
  );
}

function BvnGroup({
  group,
  values,
  disabled,
  onChange,
}: {
  group: BvnConfigGroup;
  values: BvnConfigValues;
  disabled: boolean;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  const visibleFields = useMemo(
    () =>
      group.fields.filter((f) => {
        if (!f.depends_on) return true;
        return f.depends_on.equals.includes(values[f.depends_on.key]);
      }),
    [group.fields, values],
  );

  return (
    <div className="rounded-lg border border-dashboard-border/50">
      <div className="border-b border-dashboard-border/50 px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-dashboard-heading">
          {group.label}
        </h3>
        <p className="mt-0.5 text-xs text-dashboard-muted">
          {group.description}
        </p>
      </div>
      <div className="divide-y divide-dashboard-border/40">
        {visibleFields.map((field) => (
          <BvnFieldRow
            key={field.key}
            field={field}
            value={values[field.key]}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function BvnFieldRow({
  field,
  value,
  disabled,
  onChange,
}: {
  field: BvnConfigField;
  value: string | number | boolean | undefined;
  disabled: boolean;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-3">
      <div className="min-w-0">
        <label className="text-sm font-medium text-dashboard-heading">
          {field.label}
        </label>
        <p className="mt-0.5 text-xs text-dashboard-muted">{field.help}</p>
      </div>
      <div className="shrink-0">
        {field.type === "boolean" && (
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            disabled={disabled}
            onClick={() => onChange(field.key, !value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              value ? "bg-brand-bg-primary" : "bg-dashboard-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        )}

        {field.type === "enum" && (
          <select
            disabled={disabled}
            value={String(value ?? "")}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-1.5 text-sm text-dashboard-heading disabled:opacity-50"
          >
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {field.type === "number" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              disabled={disabled}
              min={field.min}
              max={field.max}
              value={Number(value ?? 0)}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
              className="w-24 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-1.5 text-right text-sm text-dashboard-heading disabled:opacity-50"
            />
            {field.unit && (
              <span className="text-xs text-dashboard-muted">{field.unit}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BvnCredentialsCard({
  credentials,
  appIdEdit,
  secretEdit,
  disabled,
  onAppId,
  onSecret,
}: {
  credentials: BvnCredentialStatus | null;
  appIdEdit: string | undefined;
  secretEdit: string | undefined;
  disabled: boolean;
  onAppId: (v: string) => void;
  onSecret: (v: string) => void;
}) {
  const sourceLabel =
    credentials?.source === "db"
      ? "Set here"
      : credentials?.source === "env"
        ? "From server env (set here to override)"
        : "Not set";

  return (
    <div className="rounded-lg border border-dashboard-border/50">
      <div className="border-b border-dashboard-border/50 px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-dashboard-heading">
          Provider credentials (Dojah)
        </h3>
        <p className="mt-0.5 text-xs text-dashboard-muted">
          App ID and secret key from Dojah → Developers → Configuration. The
          secret is encrypted and never shown again. Current: {sourceLabel}.
        </p>
      </div>
      <div className="divide-y divide-dashboard-border/40">
        <div className="flex items-start justify-between gap-4 px-3 py-3">
          <div className="min-w-0">
            <label className="text-sm font-medium text-dashboard-heading">
              App ID
            </label>
            <p className="mt-0.5 text-xs text-dashboard-muted">
              Semi-public identifier for your Dojah app.
            </p>
          </div>
          <input
            type="text"
            disabled={disabled}
            value={appIdEdit ?? credentials?.app_id ?? ""}
            onChange={(e) => onAppId(e.target.value)}
            placeholder="6926f91b511c41c114c22dd4"
            className="w-56 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-1.5 text-sm text-dashboard-heading disabled:opacity-50"
          />
        </div>
        <div className="flex items-start justify-between gap-4 px-3 py-3">
          <div className="min-w-0">
            <label className="text-sm font-medium text-dashboard-heading">
              Secret key
            </label>
            <p className="mt-0.5 text-xs text-dashboard-muted">
              {credentials?.has_secret
                ? "A secret is set. Type a new one to replace it; leave blank to keep."
                : "Paste your Dojah private/secret key."}
            </p>
          </div>
          <input
            type="password"
            autoComplete="new-password"
            disabled={disabled}
            value={secretEdit ?? ""}
            onChange={(e) => onSecret(e.target.value)}
            placeholder={credentials?.has_secret ? "•••••••••• (set)" : "prod_sk_…"}
            className="w-56 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-1.5 text-sm text-dashboard-heading disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
