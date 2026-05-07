"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Clock,
} from "lucide-react";
import type { AdminActionItem, AdminActionItemType } from "@/types/admin/dashboard";

const ACTION_CONFIG: Record<
  AdminActionItemType,
  { label: string; icon: typeof AlertTriangle; color: string; bg: string }
> = {
  escalated_tickets: {
    label: "Escalated Tickets",
    icon: AlertTriangle,
    color: "text-red-700",
    bg: "bg-red-50",
  },
  flagged_audits: {
    label: "Flagged Audit Logs",
    icon: ShieldAlert,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  pending_kyc: {
    label: "Pending KYC Reviews",
    icon: UserCheck,
    color: "text-orange-700",
    bg: "bg-orange-50",
  },
  pending_transactions: {
    label: "Pending Transactions",
    icon: Clock,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
};

interface ActionItemsProps {
  items: AdminActionItem[];
}

export function ActionItems({ items }: ActionItemsProps) {
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h2 className="text-sm font-semibold text-dashboard-heading mb-3">
        Attention Needed
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const config = ACTION_CONFIG[item.type];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <div
              key={item.type}
              className={`flex items-center gap-3 rounded-xl border border-dashboard-border/60 p-3.5 ${config.bg}`}
            >
              <div className={`flex-shrink-0 ${config.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold tabular-nums ${config.color}`}>
                  {item.count}
                </p>
                <p className="text-xs text-dashboard-muted truncate">
                  {config.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
