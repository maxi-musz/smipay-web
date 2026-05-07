"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import type { SupportTicketItem } from "@/types/admin/support";

interface SupportTableProps {
  tickets: SupportTicketItem[];
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function formatType(str: string): string {
  return str
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_user: "bg-orange-50 text-orange-700 border-orange-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  escalated: "bg-red-50 text-red-700 border-red-200",
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

const TYPE_CHIP: Record<string, string> = {
  REGISTRATION_ISSUE: "bg-purple-50 text-purple-700",
  LOGIN_ISSUE: "bg-indigo-50 text-indigo-700",
  TRANSACTION_ISSUE: "bg-blue-50 text-blue-700",
  PAYMENT_ISSUE: "bg-emerald-50 text-emerald-700",
  ACCOUNT_ISSUE: "bg-teal-50 text-teal-700",
  WALLET_ISSUE: "bg-amber-50 text-amber-700",
  CARD_ISSUE: "bg-orange-50 text-orange-700",
  KYC_VERIFICATION_ISSUE: "bg-cyan-50 text-cyan-700",
  SECURITY_ISSUE: "bg-red-50 text-red-700",
  FEATURE_REQUEST: "bg-pink-50 text-pink-700",
  BUG_REPORT: "bg-rose-50 text-rose-700",
  BILLING_ISSUE: "bg-lime-50 text-lime-700",
  REFUND_REQUEST: "bg-yellow-50 text-yellow-700",
  GENERAL_INQUIRY: "bg-slate-100 text-slate-600",
  OTHER: "bg-slate-100 text-slate-600",
};

const SORTABLE_COLS: string[] = ["createdAt", "updatedAt", "priority", "status", "support_type"];

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function SupportTable({
  tickets,
  sortBy,
  sortOrder,
  onSort,
}: SupportTableProps) {
  const router = useRouter();

  if (tickets.length === 0) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-6 py-12 text-center">
        <p className="text-sm text-dashboard-muted">No tickets found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-dashboard-border/60">
              {[
                { key: "ticket_number", label: "Ticket #" },
                { key: "user", label: "User" },
                { key: "subject", label: "Subject" },
                { key: "support_type", label: "Type" },
                { key: "status", label: "Status" },
                { key: "priority", label: "Priority" },
                { key: "assigned", label: "Assigned" },
                { key: "messages", label: "Messages" },
                { key: "updatedAt", label: "Last Response" },
                { key: "createdAt", label: "Created" },
              ].map(({ key, label }) => {
                const sortable = SORTABLE_COLS.includes(key);
                const active = sortBy === key;
                return (
                  <th
                    key={key}
                    onClick={sortable ? () => onSort(key) : undefined}
                    className={`px-3 py-2.5 text-left font-semibold text-dashboard-muted uppercase tracking-wider whitespace-nowrap ${
                      sortable ? "cursor-pointer hover:text-dashboard-heading select-none" : ""
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {active && (
                        <span className="text-brand-bg-primary">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-border/40">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => router.push(`/unified-admin/support/${ticket.id}`)}
                className="hover:bg-dashboard-bg/50 cursor-pointer transition-colors"
              >
                {/* Ticket # */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="font-mono text-[10px] font-semibold text-blue-600">
                    {ticket.ticket_number}
                  </span>
                </td>

                {/* User */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={ticket.user} />
                    <span className="text-dashboard-heading font-medium truncate max-w-[100px]">
                      {ticket.user
                        ? `${ticket.user.first_name ?? ""} ${ticket.user.last_name ?? ""}`.trim() || ticket.email || "Unknown"
                        : ticket.email || "Unknown"}
                    </span>
                  </div>
                </td>

                {/* Subject */}
                <td className="px-3 py-2.5 whitespace-nowrap" title={ticket.subject}>
                  <span className="text-dashboard-heading truncate block max-w-[180px]">
                    {ticket.subject}
                  </span>
                </td>

                {/* Type */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${TYPE_CHIP[ticket.support_type] ?? "bg-slate-100 text-slate-600"}`}>
                    {formatType(ticket.support_type)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_BADGE[ticket.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {formatType(ticket.status)}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${PRIORITY_BADGE[ticket.priority] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </span>
                </td>

                {/* Assigned */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {ticket.assigned_admin ? (
                    <span className="text-dashboard-muted">
                      {`${ticket.assigned_admin.first_name ?? ""} ${ticket.assigned_admin.last_name ?? ""}`.trim()}
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium text-[10px]">Unassigned</span>
                  )}
                </td>

                {/* Messages */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-dashboard-muted">
                    <MessageCircle className="h-3 w-3" />
                    <span className="tabular-nums">{ticket.message_count}</span>
                  </span>
                </td>

                {/* Last Response */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <LastResponseCell
                    lastResponseAt={ticket.last_response_at}
                    status={ticket.status}
                    createdAt={ticket.createdAt}
                  />
                </td>

                {/* Created */}
                <td className="px-3 py-2.5 whitespace-nowrap text-dashboard-muted" title={new Date(ticket.createdAt).toLocaleString()}>
                  {relativeTime(ticket.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function LastResponseCell({
  lastResponseAt,
  status,
  createdAt,
}: {
  lastResponseAt: string | null;
  status: string;
  createdAt: string;
}) {
  if (lastResponseAt) {
    return (
      <span
        className="text-dashboard-muted"
        title={new Date(lastResponseAt).toLocaleString()}
      >
        {relativeTime(lastResponseAt)}
      </span>
    );
  }

  const isPending = status === "pending" || status === "in_progress" || status === "escalated";
  const waitingSince = Date.now() - new Date(createdAt).getTime();
  const isOverdue = isPending && waitingSince > FOUR_HOURS_MS;

  return (
    <span className={isOverdue ? "text-red-600 font-medium" : "text-dashboard-muted"}>
      {isOverdue ? "No response" : "—"}
    </span>
  );
}

function UserAvatar({ user }: { user: SupportTicketItem["user"] }) {
  const initials = user
    ? `${(user.first_name ?? "")[0] ?? ""}${(user.last_name ?? "")[0] ?? ""}`.toUpperCase()
    : "?";
  const img = user?.profile_image?.secure_url;

  return (
    <div className="h-7 w-7 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {img ? (
        <img src={img} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-brand-bg-primary">{initials}</span>
      )}
    </div>
  );
}
