"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  FlaskConical,
  LayoutDashboard,
  LifeBuoy,
  Library,
  MessageSquare,
  PlugZap,
  Settings,
  ShieldAlert,
  Sliders,
  Sparkles,
  Star,
  Wand2,
  Wrench,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavItem[];
}

const NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    href: "/unified-admin/smileai",
  },
  {
    id: "conversations",
    label: "Conversations",
    icon: MessageSquare,
    href: "/unified-admin/smileai/conversations",
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    icon: Library,
    children: [
      {
        label: "Documents",
        href: "/unified-admin/smileai/knowledge-base",
        icon: Library,
      },
      {
        label: "Upload",
        href: "/unified-admin/smileai/knowledge-base/upload",
        icon: Sparkles,
      },
      {
        label: "Coverage Gaps",
        href: "/unified-admin/smileai/knowledge-base/coverage",
        icon: ShieldAlert,
      },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    icon: Wrench,
    href: "/unified-admin/smileai/actions",
  },
  {
    id: "personas",
    label: "Personas",
    icon: Wand2,
    href: "/unified-admin/smileai/personas",
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: CheckCheck,
    href: "/unified-admin/smileai/approvals",
  },
  {
    id: "handoffs",
    label: "Handoffs",
    icon: LifeBuoy,
    href: "/unified-admin/smileai/handoffs",
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: Star,
    href: "/unified-admin/smileai/feedback",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/unified-admin/smileai/analytics",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    children: [
      {
        label: "Provider",
        href: "/unified-admin/smileai/settings/provider",
        icon: Bot,
      },
      {
        label: "Vector Store",
        href: "/unified-admin/smileai/settings/vector-store",
        icon: FlaskConical,
      },
      {
        label: "Limits",
        href: "/unified-admin/smileai/settings/limits",
        icon: Sliders,
      },
      {
        label: "Safety",
        href: "/unified-admin/smileai/settings/safety",
        icon: ShieldAlert,
      },
      {
        label: "Service availability",
        href: "/unified-admin/smileai/settings/services",
        icon: PlugZap,
      },
      {
        label: "Lifecycle",
        href: "/unified-admin/smileai/settings/lifecycle",
        icon: Clock,
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/unified-admin/smileai") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSectionActive(pathname: string, section: NavSection): boolean {
  if (section.href && isActive(pathname, section.href)) return true;
  return !!section.children?.some((c) => isActive(pathname, c.href));
}

export default function SmileAiSectionNav() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const sec of NAV) {
      if (sec.children && sec.children.some((c) => isActive(pathname, c.href))) {
        s.add(sec.id);
      }
    }
    return s;
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <aside className="hidden xl:block w-56 shrink-0 border-r border-dashboard-border/60 bg-dashboard-surface min-h-screen">
      <div className="px-4 py-4 border-b border-dashboard-border/60">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-bg-primary flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dashboard-heading">SmileAI</p>
            <p className="text-[11px] text-dashboard-muted">In-app assistant</p>
          </div>
        </div>
      </div>
      <nav className="px-3 py-3 space-y-0.5">
        {NAV.map((section) => {
          const active = isSectionActive(pathname, section);
          if (section.href && !section.children) {
            return (
              <Link
                key={section.id}
                href={section.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-brand-bg-primary text-white shadow-sm"
                    : "text-dashboard-heading hover:bg-dashboard-bg"
                }`}
              >
                <section.icon className="h-4 w-4" />
                <span className="font-medium">{section.label}</span>
              </Link>
            );
          }
          const isOpen = expanded.has(section.id);
          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "text-dashboard-heading bg-dashboard-bg"
                    : "text-dashboard-heading hover:bg-dashboard-bg"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <section.icon className="h-4 w-4" />
                  <span className="font-medium">{section.label}</span>
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-dashboard-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-dashboard-muted" />
                )}
              </button>
              {isOpen && section.children && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {section.children.map((c) => {
                    const ca = isActive(pathname, c.href);
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                          ca
                            ? "bg-orange-50 text-orange-700 font-medium"
                            : "text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
                        }`}
                      >
                        <c.icon className="h-3.5 w-3.5" />
                        <span>{c.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
