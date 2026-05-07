import { NOTIFICATION_CAMPAIGN_STATUSES } from "@/types/admin/notifications";

interface NotificationStatusBadgeProps {
  status: string;
}

export function NotificationStatusBadge({ status }: NotificationStatusBadgeProps) {
  const item = NOTIFICATION_CAMPAIGN_STATUSES.find((s) => s.value === status);
  const color = item?.color ?? "gray";

  const clsMap: Record<string, string> = {
    gray: "bg-slate-100 text-slate-700 border border-slate-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    red: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${clsMap[color]}`}>
      {item?.label ?? status}
    </span>
  );
}
