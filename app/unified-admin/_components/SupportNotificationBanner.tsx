"use client";

import { useRouter } from "next/navigation";
import { X, MessageSquareText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  useAdminSupportNotifications,
  type AdminSupportNotification,
} from "@/store/admin/admin-support-notifications-store";

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  return `${mins}m ago`;
}

function NotificationItem({ n }: { n: AdminSupportNotification }) {
  const router = useRouter();
  const { dismiss, dismissByTicket } = useAdminSupportNotifications();

  const handleClick = () => {
    dismissByTicket(n.ticketId);
    router.push(`/unified-admin/support/${n.ticketId}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -32, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, x: 200, height: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="group w-full flex items-center gap-2.5 px-3.5 py-2 bg-white/95 backdrop-blur-sm border-b border-slate-100 hover:bg-blue-50/60 transition-colors text-left"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <MessageSquareText className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-800 truncate">
            {n.senderName || "User"}{" "}
            <span className="font-normal text-slate-500">
              on {n.ticketNumber}
            </span>
          </p>
          <p className="text-[10px] text-slate-500 truncate">{n.preview}</p>
        </div>

        <span className="text-[9px] text-slate-400 whitespace-nowrap shrink-0">
          {timeAgo(n.timestamp)}
        </span>

        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            dismiss(n.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              dismiss(n.id);
            }
          }}
          className="p-0.5 rounded hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <X className="h-3 w-3" />
        </span>
      </button>
    </motion.div>
  );
}

export default function SupportNotificationBanner() {
  const { notifications, clearAll } = useAdminSupportNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-[80] pointer-events-none">
      <div className="ml-[240px] pointer-events-auto">
        <div className="max-w-xl mx-auto shadow-lg rounded-b-xl overflow-hidden border border-t-0 border-slate-200/80 bg-white/95 backdrop-blur-sm">
          {/* Summary strip */}
          {notifications.length > 1 && (
            <div className="flex items-center justify-between px-3.5 py-1 bg-blue-600 text-white">
              <span className="text-[10px] font-medium">
                {notifications.length} new support message
                {notifications.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] font-medium text-blue-200 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Notification stack (show max 4) */}
          <div className="max-h-[200px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {notifications.slice(0, 4).map((n) => (
                <NotificationItem key={n.id} n={n} />
              ))}
            </AnimatePresence>
          </div>

          {notifications.length > 4 && (
            <div className="px-3.5 py-1.5 text-center border-t border-slate-100">
              <span className="text-[10px] text-slate-500">
                +{notifications.length - 4} more
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
