"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  MessageSquare,
  Plug,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  enabled?: boolean;
}

const NAV: NavItem[] = [
  {
    label: "SMS Providers",
    href: "/unified-admin/providers/sms",
    icon: MessageSquare,
    enabled: true,
  },
  {
    label: "Email Providers",
    href: "/unified-admin/providers/email",
    icon: Mail,
    enabled: false,
  },
  {
    label: "Utility Providers",
    href: "/unified-admin/providers/utility",
    icon: Plug,
    enabled: false,
  },
];

export function ProvidersSectionNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <nav className="mb-4 border-b border-dashboard-border/60 pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-dashboard-muted mb-2"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        Provider sections
      </button>
      {open && (
        <div className="flex flex-wrap gap-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const disabled = item.enabled === false;
            const cls = [
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              active
                ? "bg-brand-bg-primary text-white border-brand-bg-primary"
                : "border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg",
              disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
            ].join(" ");

            if (disabled) {
              return (
                <span key={item.href} className={cls} title="Coming soon">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </span>
              );
            }

            return (
              <Link key={item.href} href={item.href} className={cls}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
