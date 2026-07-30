"use client";

import { LayoutGrid } from "lucide-react";

/** Top-level admin panels — extended per user type in later steps. */
export type AdminPanelId = "general";

const PANELS: {
  id: AdminPanelId;
  label: string;
  icon: typeof LayoutGrid;
}[] = [{ id: "general", label: "General", icon: LayoutGrid }];

interface AdminPanelTabsProps {
  active: AdminPanelId;
  onChange: (id: AdminPanelId) => void;
}

export function AdminPanelTabs({ active, onChange }: AdminPanelTabsProps) {
  return (
    <div className="flex-shrink-0 bg-dashboard-surface border-b border-dashboard-border/60">
      <div className="flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {PANELS.map((panel) => {
          const isActive = active === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => onChange(panel.id)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-brand-bg-primary text-brand-bg-primary"
                  : "border-transparent text-dashboard-muted hover:text-dashboard-heading"
              }`}
            >
              <panel.icon className="h-4 w-4" />
              {panel.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
