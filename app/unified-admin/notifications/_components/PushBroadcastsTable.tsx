import Link from "next/link";
import { RotateCcw, Ban, CopyPlus, Trash2, Eye, Loader2 } from "lucide-react";
import type { PushBroadcast } from "@/types/admin/push-broadcasts";
import { PushBroadcastStatusBadge } from "./PushBroadcastStatusBadge";

interface PushBroadcastsTableProps {
  broadcasts: PushBroadcast[];
  actionLoadingId: string | null;
  onCancel: (id: string) => void;
  onResendFailed: (id: string) => void;
  onDelete: (id: string) => void;
}

type PushBroadcastActionHandlers = Pick<
  PushBroadcastsTableProps,
  "actionLoadingId" | "onCancel" | "onResendFailed" | "onDelete"
>;

function formatDate(val?: string | null): string {
  if (!val) return "\u2014";
  return new Date(val).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProgress(broadcast: PushBroadcast): number {
  if (!broadcast.total_recipients) return 0;
  const done = broadcast.sent_count + broadcast.failed_count;
  return Math.min(100, Math.round((done / broadcast.total_recipients) * 100));
}

function PushBroadcastActions({
  broadcast,
  actionLoadingId,
  onCancel,
  onResendFailed,
  onDelete,
  compact,
}: PushBroadcastActionHandlers & { broadcast: PushBroadcast; compact: boolean }) {
  const canCancel = broadcast.status === "scheduled";
  const canResend =
    (broadcast.status === "sent" || broadcast.status === "failed") && broadcast.failed_count > 0;
  const canSendAgain =
    broadcast.status === "sent" ||
    broadcast.status === "failed" ||
    broadcast.status === "cancelled";
  const canDelete = broadcast.status !== "sending";
  const loadingThis = actionLoadingId === broadcast.id;

  const box = compact
    ? "inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg touch-manipulation"
    : "inline-flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-lg touch-manipulation";
  const icon = compact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-5 w-5";

  return (
    <div
      className={
        compact
          ? "flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
          : "flex flex-wrap items-center gap-2"
      }
    >
      <Link
        href={`/unified-admin/notifications/push/${broadcast.id}`}
        title="View broadcast"
        aria-label="View broadcast"
        className={`${box} border border-dashboard-border/80 text-dashboard-heading bg-dashboard-bg hover:bg-dashboard-border/30 transition-colors`}
      >
        <Eye className={icon} aria-hidden />
      </Link>
      {canCancel && (
        <button
          type="button"
          disabled={loadingThis}
          title="Cancel scheduled broadcast"
          aria-label="Cancel scheduled broadcast"
          onClick={() => onCancel(broadcast.id)}
          className={`${box} border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors`}
        >
          <Ban className={icon} aria-hidden />
        </button>
      )}
      {canResend && (
        <button
          type="button"
          disabled={loadingThis}
          title="Resend failed deliveries"
          aria-label="Resend failed deliveries"
          onClick={() => onResendFailed(broadcast.id)}
          className={`${box} border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors`}
        >
          <RotateCcw className={icon} aria-hidden />
        </button>
      )}
      {canSendAgain && (
        <Link
          href={`/unified-admin/notifications/push/new?from=${encodeURIComponent(broadcast.id)}`}
          title="Send again (copy as new broadcast)"
          aria-label="Send again (copy as new broadcast)"
          className={`${box} border border-amber-200 text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors`}
        >
          <CopyPlus className={icon} aria-hidden />
        </Link>
      )}
      {canDelete && (
        <button
          type="button"
          disabled={loadingThis}
          title="Delete broadcast"
          aria-label="Delete broadcast"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              !window.confirm(
                "Delete this broadcast and its delivery logs? In-app inbox copies stay, but the link to this broadcast is removed. This cannot be undone.",
              )
            ) {
              return;
            }
            onDelete(broadcast.id);
          }}
          className={`${box} border border-red-200 text-red-800 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors`}
        >
          <Trash2 className={icon} aria-hidden />
        </button>
      )}
      {broadcast.status === "sending" && (
        <span
          className={`${box} border border-dashboard-border/60 text-dashboard-muted`}
          title="Sending"
          aria-label="Sending"
        >
          <Loader2 className={`${icon} animate-spin`} aria-hidden />
        </span>
      )}
    </div>
  );
}

export function PushBroadcastsTable({
  broadcasts,
  actionLoadingId,
  onCancel,
  onResendFailed,
  onDelete,
}: PushBroadcastsTableProps) {
  const actionProps = { actionLoadingId, onCancel, onResendFailed, onDelete };

  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden w-full max-w-full min-w-0">
      {broadcasts.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-dashboard-muted">No push broadcasts found.</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto overscroll-x-contain -mx-px">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-dashboard-bg/70 border-b border-dashboard-border/60">
                <tr className="text-left">
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted min-w-[12rem]">
                    Broadcast
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted whitespace-nowrap">
                    Audience
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted whitespace-nowrap">
                    Progress
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted whitespace-nowrap">
                    Schedule/Sent
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted whitespace-nowrap">
                    Created
                  </th>
                  <th className="px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted whitespace-nowrap min-w-[13.5rem] w-[13.5rem]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((broadcast) => {
                  const progress = getProgress(broadcast);
                  return (
                    <tr
                      key={broadcast.id}
                      className="border-t border-dashboard-border/40 hover:bg-dashboard-bg/40 transition-colors"
                    >
                      <td className="px-3 py-3 align-top min-w-0 max-w-xs lg:max-w-md">
                        <Link
                          href={`/unified-admin/notifications/push/${broadcast.id}`}
                          className="text-sm font-semibold text-dashboard-heading hover:text-brand-bg-primary transition-colors line-clamp-2"
                        >
                          {broadcast.title}
                        </Link>
                        <p className="text-xs text-dashboard-muted mt-0.5 line-clamp-1">{broadcast.body}</p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-sm text-dashboard-heading capitalize">{broadcast.target_type}</p>
                        <p className="text-xs text-dashboard-muted mt-0.5">
                          {broadcast.total_recipients.toLocaleString()} recipients
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <PushBroadcastStatusBadge status={broadcast.status} />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="w-full max-w-[11rem]">
                          <div className="h-2 rounded-full bg-dashboard-border/60 overflow-hidden">
                            <div
                              className="h-full bg-brand-bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-dashboard-muted mt-1">
                            {broadcast.sent_count}/{broadcast.total_recipients} sent • {broadcast.failed_count}{" "}
                            failed
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-xs text-dashboard-heading">
                          {broadcast.scheduled_for ? formatDate(broadcast.scheduled_for) : "Immediate"}
                        </p>
                        <p className="text-[11px] text-dashboard-muted mt-0.5">
                          Sent: {formatDate(broadcast.sent_at)}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-dashboard-muted whitespace-nowrap">
                        {formatDate(broadcast.createdAt)}
                      </td>
                      <td className="px-2 py-3 align-middle text-right whitespace-nowrap min-w-[13.5rem] w-[13.5rem]">
                        <PushBroadcastActions broadcast={broadcast} compact {...actionProps} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-dashboard-border/50">
            {broadcasts.map((broadcast) => {
              const progress = getProgress(broadcast);
              return (
                <div key={broadcast.id} className="p-4 space-y-3 bg-dashboard-surface">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/unified-admin/notifications/push/${broadcast.id}`}
                        className="text-sm font-semibold text-dashboard-heading hover:text-brand-bg-primary line-clamp-2"
                      >
                        {broadcast.title}
                      </Link>
                      <p className="text-xs text-dashboard-muted mt-0.5 line-clamp-3">{broadcast.body}</p>
                    </div>
                    <PushBroadcastStatusBadge status={broadcast.status} />
                  </div>
                  <div>
                    <div className="h-2 rounded-full bg-dashboard-border/60 overflow-hidden">
                      <div
                        className="h-full bg-brand-bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-dashboard-muted mt-1">
                      {broadcast.sent_count}/{broadcast.total_recipients} sent • {broadcast.failed_count} failed
                    </p>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-xs">
                    <dt className="text-dashboard-muted font-medium">Audience</dt>
                    <dd className="text-dashboard-heading capitalize">
                      {broadcast.target_type} · {broadcast.total_recipients.toLocaleString()} recipients
                    </dd>
                    <dt className="text-dashboard-muted font-medium">Schedule</dt>
                    <dd className="text-dashboard-heading">
                      {broadcast.scheduled_for ? formatDate(broadcast.scheduled_for) : "Immediate"}
                    </dd>
                    <dt className="text-dashboard-muted font-medium">Sent</dt>
                    <dd className="text-dashboard-heading">{formatDate(broadcast.sent_at)}</dd>
                    <dt className="text-dashboard-muted font-medium">Created</dt>
                    <dd className="text-dashboard-heading">{formatDate(broadcast.createdAt)}</dd>
                  </dl>
                  <div className="pt-2 border-t border-dashboard-border/40">
                    <PushBroadcastActions broadcast={broadcast} compact={false} {...actionProps} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
