"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Smartphone,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

interface AnalystMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  enabled: boolean;
}

const analystMenuItems: AnalystMenuItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    href: "/admin/analyst",
    enabled: true,
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    href: "/admin/analyst/users",
    enabled: true,
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    href: "/admin/analyst/transactions",
    enabled: true,
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: Wallet,
    href: "/admin/analyst/revenue",
    enabled: true,
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: Activity,
    href: "/admin/analyst/engagement",
    enabled: true,
  },
  {
    id: "devices",
    label: "Devices",
    icon: Smartphone,
    href: "/admin/analyst/devices",
    enabled: true,
  },
];

const analystOtherMenuItems: AnalystMenuItem[] = [
  {
    id: "website",
    label: "Back to Website",
    icon: Globe,
    href: "/",
    enabled: true,
  },
];

export default function AnalystSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Exact match: the Overview route ("/admin/analyst") is a prefix of every
  // sub-route, so prefix matching would light up Overview everywhere.
  const isActive = (href: string) => pathname === href;

  const closeMobile = () => setIsMobileMenuOpen(false);

  const renderMenuItem = (item: AnalystMenuItem, closeFn: () => void) => {
    if (!item.enabled) {
      return (
        <div key={item.id} className="relative group">
          <div className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-dashboard-muted cursor-not-allowed">
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </div>
          <div className="absolute left-0 top-0 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 ml-2">
            Coming Soon
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href!}
        onClick={closeFn}
        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive(item.href!)
            ? "bg-brand-bg-primary text-white font-medium shadow-sm"
            : "text-dashboard-heading hover:bg-dashboard-bg"
        }`}
      >
        <item.icon className="h-5 w-5" />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0">
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-dashboard-border bg-dashboard-surface">
        <span className="text-sm font-semibold text-dashboard-heading">
          Analyst Menu
        </span>
        <button
          type="button"
          onClick={closeMobile}
          className="p-2 -m-2 rounded-lg hover:bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 bg-dashboard-surface border-b border-dashboard-border">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-lg font-semibold relative">
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
              <BarChart3 className="h-2 w-2 text-white" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-dashboard-heading truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-orange-600 font-medium">Data Analyst</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-3">
            Analyst Panel
          </h3>
          <nav className="space-y-1">
            {analystMenuItems.map((item) => renderMenuItem(item, closeMobile))}
          </nav>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-dashboard-border bg-dashboard-surface">
        <h3 className="text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-3">
          Other
        </h3>
        <nav className="space-y-1">
          {analystOtherMenuItems.map((item) =>
            renderMenuItem(item, closeMobile),
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-dashboard-surface rounded-lg shadow-md border border-dashboard-border touch-manipulation"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-dashboard-heading" />
        ) : (
          <Menu className="h-6 w-6 text-dashboard-heading" />
        )}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[45] touch-none"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-hidden bg-dashboard-surface border-r border-dashboard-border h-full min-h-0">
        {sidebarContent}
      </aside>

      <aside
        className={`lg:hidden fixed top-0 left-0 w-[min(288px,85vw)] max-w-full h-dvh max-h-screen z-50 transform transition-transform duration-300 ease-out overscroll-contain ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Analyst navigation menu"
      >
        <div
          className="h-full min-h-0 w-full border-r border-slate-200 flex flex-col overflow-hidden overscroll-contain"
          style={{ backgroundColor: "#ffffff" }}
        >
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
