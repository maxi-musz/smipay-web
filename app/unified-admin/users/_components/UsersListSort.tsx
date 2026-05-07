"use client";

import { ArrowDownUp } from "lucide-react";
import type { AdminUserListSort, UserFilters } from "@/types/admin/users";
import { ADMIN_USER_LIST_SORT_OPTIONS } from "@/types/admin/users";

interface Props {
  listSort: UserFilters["list_sort"];
  onChange: (value: AdminUserListSort) => void;
  disabled?: boolean;
  className?: string;
}

export function UsersListSort({ listSort, onChange, disabled = false, className = "" }: Props) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs shrink-0 sm:ml-2 ${disabled ? "opacity-80" : ""} ${className}`.trim()}
    >
      <ArrowDownUp className="h-3.5 w-3.5 text-dashboard-muted shrink-0" aria-hidden />
      <label htmlFor="admin-users-list-sort" className="text-dashboard-muted whitespace-nowrap">
        Order
      </label>
      <select
        id="admin-users-list-sort"
        value={listSort}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as AdminUserListSort)}
        className="min-w-0 w-full max-w-full sm:w-auto sm:max-w-[min(280px,36vw)] md:max-w-[280px] px-2.5 py-1.5 text-xs bg-dashboard-surface border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {ADMIN_USER_LIST_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
