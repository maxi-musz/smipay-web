"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  FlaskConical,
  Info,
  LayoutGrid,
  Lock,
  RefreshCw,
  ScanFace,
  type LucideIcon,
} from "lucide-react";
import { usePermissions } from "@/hooks/admin/useAdminPermissions";
import {
  IdentityGuardsApiError,
  adminIdentityGuardsApi,
} from "@/services/admin/identity-guards-api";
import {
  GUARD_FIELDS,
  type ActivityFieldSummary,
  type IdentityGuardConfigResponse,
  type IdentityGuardRule,
} from "@/types/admin/identity-guards";
import { OverviewTab, type IdentityGuardsTab } from "./_components/OverviewTab";
import { RulesTab } from "./_components/RulesTab";
import { Simulator } from "./_components/Simulator";
import { BacktestPanel } from "./_components/BacktestPanel";
import { ActivityTab } from "./_components/ActivityTab";
import {
  Banner,
  FIELD_META,
  MODE_META,
  errorMessage,
  fieldInfo,
  modeOf,
  type GuardPerms,
} from "./_components/shared";

const fetchPageData = () =>
  Promise.allSettled([
    adminIdentityGuardsApi.getConfig(),
    adminIdentityGuardsApi.getActivity({ page: 1, limit: 1 }),
  ]);

export default function IdentityGuardsPage() {
  const { can, isSuperAdmin } = usePermissions();
  const [tab, setTab] = useState<IdentityGuardsTab>("overview");

  const [config, setConfig] = useState<IdentityGuardConfigResponse | null>(null);
  const [summary, setSummary] = useState<ActivityFieldSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const apply = useCallback(
    ([cfg, act]: Awaited<ReturnType<typeof fetchPageData>>) => {
      if (cfg.status === "fulfilled") {
        setConfig(cfg.value);
        setForbidden(false);
        setError(null);
      } else if (
        cfg.reason instanceof IdentityGuardsApiError &&
        cfg.reason.status === 403
      ) {
        setForbidden(true);
      } else {
        setError(errorMessage(cfg.reason, "Could not load Identity Guards"));
      }
      setSummary(act.status === "fulfilled" ? act.value.summary.by_field : null);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    void fetchPageData().then((res) => {
      if (active) apply(res);
    });
    return () => {
      active = false;
    };
  }, [apply]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    apply(await fetchPageData());
  }, [apply]);

  const perms: GuardPerms = useMemo(
    () => ({
      canWrite: isSuperAdmin || can("identity-guards", "write"),
      canUpdate: isSuperAdmin || can("identity-guards", "update"),
      canDelete: isSuperAdmin || can("identity-guards", "delete"),
      locked: config?.migration_pending ?? true,
    }),
    [isSuperAdmin, can, config?.migration_pending],
  );
  const readOnly = !perms.canWrite && !perms.canUpdate && !perms.canDelete;

  const upsertRule = useCallback((rule: IdentityGuardRule) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const exists = prev.rules.some((r) => r.key === rule.key);
      return {
        ...prev,
        rules: exists
          ? prev.rules.map((r) => (r.key === rule.key ? rule : r))
          : [...prev.rules, rule],
      };
    });
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setConfig((prev) =>
      prev ? { ...prev, rules: prev.rules.filter((r) => r.id !== ruleId) } : prev,
    );
  }, []);

  const tabs: { id: IdentityGuardsTab; label: string; icon: LucideIcon }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    ...GUARD_FIELDS.map((f) => ({
      id: f,
      label: fieldInfo(config?.fields, f).label,
      icon: FIELD_META[f].icon,
    })),
    { id: "simulator", label: "Simulator", icon: FlaskConical },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-dashboard-bg px-6 text-center">
        <Lock className="h-10 w-10 text-dashboard-muted" />
        <h1 className="text-lg font-bold text-dashboard-heading">No access</h1>
        <p className="max-w-sm text-sm text-dashboard-muted">
          You don&apos;t have permission to view Identity Guards. Ask a
          super-admin to grant you access.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-bg pb-10">
      <header className="sticky top-0 z-10 border-b border-dashboard-border/60 bg-dashboard-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-bg-primary">
              <ScanFace className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-dashboard-heading">
                Identity Guards
              </h1>
              <p className="text-xs text-dashboard-muted">
                Stop junk phone numbers, emails, names and BVNs before a
                provider is paid to verify them
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {readOnly && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                <Lock className="h-3.5 w-3.5" /> Read only
              </span>
            )}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-dashboard-border/60 px-3 py-2 text-xs font-medium text-dashboard-heading transition-colors hover:bg-dashboard-bg disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <nav className="-mb-px overflow-x-auto px-4 scrollbar-hide sm:px-6 lg:px-8">
          <div className="flex min-w-max gap-1">
            {tabs.map((t) => {
              const active = tab === t.id;
              const mode =
                config && t.id !== "overview" && t.id !== "simulator" && t.id !== "activity"
                  ? modeOf(config, t.id)
                  : null;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-brand-bg-primary text-brand-bg-primary"
                      : "border-transparent text-dashboard-muted hover:text-dashboard-heading"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {mode && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${MODE_META[mode].dot}`}
                      title={`Mode: ${mode}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        {error && (
          <Banner
            tone="error"
            action={
              <button
                type="button"
                onClick={load}
                className="text-xs font-semibold underline"
              >
                Retry
              </button>
            }
          >
            {error}
          </Banner>
        )}

        {config?.migration_pending && (
          <Banner tone="warn">
            <strong>Run the identity_guards migration</strong> — showing code
            defaults, edits disabled. Guards are already live on these
            defaults; the Simulator and Backtest work as normal.
          </Banner>
        )}

        {tab === "simulator" ? (
          <>
            <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
              <header className="flex items-start gap-3 border-b border-dashboard-border/60 px-4 py-3.5 sm:px-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dashboard-bg">
                  <FlaskConical className="h-4 w-4 text-dashboard-heading" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-dashboard-heading">Simulator</h2>
                  <p className="text-xs text-dashboard-muted">
                    Run any value through the saved rules exactly as sign-up
                    would — without writing anything or calling a provider.
                  </p>
                </div>
              </header>
              <div className="px-4 py-4 sm:px-5">
                <Simulator
                  modes={config?.modes}
                  fields={config?.fields}
                  bvnSandbox={config?.notes?.bvn_sandbox ?? false}
                />
              </div>
            </section>
            <BacktestPanel fields={config?.fields} perms={perms} />
          </>
        ) : tab === "activity" ? (
          <ActivityTab
            fields={config?.fields}
            rules={config?.rules ?? []}
            surfaces={config?.surfaces}
          />
        ) : !config ? (
          loading ? (
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-xl border border-dashboard-border/60 bg-dashboard-surface" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {GUARD_FIELDS.map((f) => (
                  <div
                    key={f}
                    className="h-56 animate-pulse rounded-xl border border-dashboard-border/60 bg-dashboard-surface"
                  />
                ))}
              </div>
            </div>
          ) : null
        ) : tab === "overview" ? (
          <OverviewTab
            config={config}
            perms={perms}
            summary={summary}
            onConfigSaved={setConfig}
            onReload={load}
            onOpenTab={setTab}
          />
        ) : (
          <RulesTab
            key={tab}
            field={tab}
            config={config}
            perms={perms}
            onRuleSaved={upsertRule}
            onRuleRemoved={removeRule}
            onReload={load}
          />
        )}

        <p className="flex items-center gap-1.5 px-0.5 text-[11px] text-dashboard-muted">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Saved changes apply on this server at once and reach every other
          server within about 30 seconds.
        </p>
      </div>
    </div>
  );
}
