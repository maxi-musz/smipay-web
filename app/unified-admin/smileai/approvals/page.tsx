"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck, RefreshCw, ShieldQuestion, X } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAuth } from "@/hooks/useAuth";
import { isDevAdminEmail } from "@/lib/dev-admin";
import { DevOnlyBadge } from "@/components/DevOnlyBadge";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatDateTime,
} from "../_components/Helpers";

type ActionApproval = {
  id: string;
  payload: { kind: "create" | "update"; dto?: Record<string, unknown> };
  proposed_by: string;
  status: string;
  createdAt: string;
};

type PersonaApproval = {
  id: string;
  persona_id: string;
  prompt_version: number;
  proposed_by: string;
  status: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const { user: authUser } = useAuth();
  const isDev = useMemo(
    () => isDevAdminEmail(authUser?.email),
    [authUser?.email],
  );
  const myUserId = authUser?.id ?? null;
  const [actionItems, setActionItems] = useState<ActionApproval[] | null>(null);
  const [personaItems, setPersonaItems] = useState<PersonaApproval[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [actions, personas] = await Promise.all([
        smileAiApi.actions.listApprovals(),
        smileAiApi.personas.listApprovals(),
      ]);
      setActionItems((actions.items ?? []) as unknown as ActionApproval[]);
      setPersonaItems(
        (personas.items ?? []) as unknown as PersonaApproval[],
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decideAction = async (id: string, accept: boolean) => {
    setBusyId(id);
    try {
      if (accept) await smileAiApi.actions.approveApproval(id);
      else await smileAiApi.actions.rejectApproval(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const decidePersona = async (id: string, accept: boolean) => {
    setBusyId(id);
    try {
      if (accept) await smileAiApi.personas.approveApproval(id);
      else await smileAiApi.personas.rejectApproval(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Pending approvals"
        description="Sensitive action and persona changes awaiting a second admin"
        icon={<ShieldQuestion className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-6">
        <ErrorBanner error={error} onRetry={load} />

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
            Sensitive action changes
          </h3>
          {!actionItems ? (
            <Card className="p-4">
              <Skeleton height="3rem" />
            </Card>
          ) : actionItems.length === 0 ? (
            <Card className="p-4 text-sm text-dashboard-muted">
              No pending action approvals.
            </Card>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item) => (
                <Card key={item.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold capitalize">
                      {item.payload?.kind ?? "change"}
                    </span>
                    <span className="text-[11px] text-dashboard-muted">
                      Proposed by {item.proposed_by} · {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <pre className="overflow-auto rounded-lg bg-dashboard-bg p-3 text-[11px] font-mono">
                    {JSON.stringify(item.payload, null, 2)}
                  </pre>
                  <DecisionButtons
                    isOwnRequest={item.proposed_by === myUserId}
                    isDev={isDev}
                    busy={busyId === item.id}
                    onApprove={() => void decideAction(item.id, true)}
                    onReject={() => void decideAction(item.id, false)}
                    approveLabel="Approve"
                  />
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
            Persona activations
          </h3>
          {!personaItems ? (
            <Card className="p-4">
              <Skeleton height="3rem" />
            </Card>
          ) : personaItems.length === 0 ? (
            <Card className="p-4 text-sm text-dashboard-muted">
              No pending persona approvals.
            </Card>
          ) : (
            <div className="space-y-2">
              {personaItems.map((item) => (
                <Card key={item.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold">
                      Persona {item.persona_id} · v{item.prompt_version}
                    </span>
                    <span className="text-[11px] text-dashboard-muted">
                      Proposed by {item.proposed_by} · {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <DecisionButtons
                    isOwnRequest={item.proposed_by === myUserId}
                    isDev={isDev}
                    busy={busyId === item.id}
                    onApprove={() => void decidePersona(item.id, true)}
                    onReject={() => void decidePersona(item.id, false)}
                    approveLabel="Approve & activate"
                  />
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Approve / reject buttons that respect the 4-eyes rule.
 *
 * - When the current admin is the proposer of the request, the buttons
 *   are disabled with a "self-approve" tooltip — unless the admin is a
 *   listed dev (DEV_EMAILS env), in which case the buttons stay enabled
 *   and a small "dev" badge is shown so it's obvious this is a local
 *   escape hatch and not the production flow.
 */
function DecisionButtons({
  isOwnRequest,
  isDev,
  busy,
  onApprove,
  onReject,
  approveLabel,
}: {
  isOwnRequest: boolean;
  isDev: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  approveLabel: string;
}) {
  const blocked = isOwnRequest && !isDev;
  const tooltip = blocked
    ? "You proposed this change — a second admin must decide it. Add your email to DEV_EMAILS for a local override."
    : isOwnRequest && isDev
      ? "Dev override — approving your own request. Production setups must use a second admin."
      : undefined;
  return (
    <div className="flex justify-end items-center gap-2 pt-1">
      {blocked && (
        <span className="text-[10px] text-amber-700 italic mr-1">
          You proposed this — a second admin must decide.
        </span>
      )}
      <button
        type="button"
        onClick={onReject}
        disabled={busy || blocked}
        title={tooltip}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </button>
      <button
        type="button"
        onClick={onApprove}
        disabled={busy || blocked}
        title={tooltip}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckCheck className="h-3.5 w-3.5" />
        {approveLabel}
        {isOwnRequest && isDev && <DevOnlyBadge />}
      </button>
    </div>
  );
}
