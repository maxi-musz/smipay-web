"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  Headphones,
  CreditCard,
  UserPlus,
  BarChart3,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ScrollText,
  Gift,
  Coins,
  Percent,
  BellRing,
  Sparkles,
  MonitorSmartphone,
  Bot,
  Smartphone,
  Plug,
  MessageSquare,
  Mail,
} from "lucide-react";

// Show "New" badge until this date (ISO). Used for recently added features (e.g. 7 days).
const MARKUP_NEW_BADGE_UNTIL = "2026-03-20"; // 7 days from feature add

interface AdminMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  enabled: boolean;
  /** If set (ISO date string), show "New" badge until this date (inclusive). */
  showNewBadgeUntil?: string;
  submenu?: {
    id: string;
    label: string;
    href: string;
    icon?: LucideIcon;
    enabled: boolean;
  }[];
}

const adminMenuItems: AdminMenuItem[] = [
  {
    id: "audit-logs",
    label: "Audit Logs",
    icon: ScrollText,
    href: "/unified-admin/audit-logs",
    enabled: true,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/unified-admin/dashboard",
    enabled: true,
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    href: "/unified-admin/users",
    enabled: true,
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    href: "/unified-admin/transactions",
    enabled: true,
  },
  {
    id: "support",
    label: "Support Tickets",
    icon: Headphones,
    href: "/unified-admin/support",
    enabled: true,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: BellRing,
    href: "/unified-admin/notifications",
    enabled: true,
  },
  {
    id: "providers",
    label: "Providers",
    icon: Plug,
    enabled: true,
    submenu: [
      {
        id: "sms-providers",
        label: "SMS Providers",
        href: "/unified-admin/providers/sms",
        icon: MessageSquare,
        enabled: true,
      },
      {
        id: "email-providers",
        label: "Email Providers",
        href: "/unified-admin/providers/email",
        icon: Mail,
        enabled: false,
      },
      {
        id: "utility-providers",
        label: "Utility Providers",
        href: "/unified-admin/providers/utility",
        icon: Plug,
        enabled: false,
      },
    ],
  },
  {
    id: "smileai",
    label: "SmileAI",
    icon: Bot,
    href: "/unified-admin/smileai",
    enabled: true,
    showNewBadgeUntil: "2026-06-30",
  },
  {
    id: "devices",
    label: "Device Management",
    icon: MonitorSmartphone,
    href: "/unified-admin/devices",
    enabled: true,
  },
  {
    id: "markup",
    label: "Markup",
    icon: Percent,
    href: "/unified-admin/markup",
    enabled: true,
    showNewBadgeUntil: MARKUP_NEW_BADGE_UNTIL,
  },
  {
    id: "kyc",
    label: "KYC Verification",
    icon: ShieldCheck,
    href: "/unified-admin/kyc",
    enabled: true,
  },
  {
    id: "rewards",
    label: "Rewards",
    icon: Gift,
    enabled: true,
    submenu: [
      {
        id: "referrals",
        label: "Referrals",
        href: "/unified-admin/referrals",
        icon: UserPlus,
        enabled: true,
      },
      {
        id: "cashback",
        label: "Cashback",
        href: "/unified-admin/cashback",
        icon: Coins,
        enabled: true,
      },
      {
        id: "first-tx-reward",
        label: "First Tx Reward",
        href: "/unified-admin/first-tx-reward",
        icon: Sparkles,
        enabled: true,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    enabled: true,
    submenu: [
      {
        id: "app-version",
        label: "App Version",
        href: "/unified-admin/settings/app-version",
        icon: Smartphone,
        enabled: true,
      },
    ],
  },
  {
    id: "cards",
    label: "Virtual Cards",
    icon: CreditCard,
    href: "/unified-admin/cards",
    enabled: false,
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: BarChart3,
    href: "/unified-admin/compliance",
    enabled: false,
  },
];

const adminOtherMenuItems: AdminMenuItem[] = [
  {
    id: "website",
    label: "Back to Website",
    icon: Globe,
    href: "/",
    enabled: true,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const initial: string[] = [];
    for (const item of adminMenuItems) {
      if (item.submenu?.some((sub) => pathname.startsWith(sub.href))) {
        initial.push(item.id);
      }
    }
    return initial;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const renderMenuItem = (item: AdminMenuItem, closeMobile: () => void) => {
    if (item.submenu) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-dashboard-bg text-dashboard-heading transition-colors"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-dashboard-muted" />
              <span className="font-medium">{item.label}</span>
            </div>
            {openMenus.includes(item.id) ? (
              <ChevronDown className="h-4 w-4 text-dashboard-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-dashboard-muted" />
            )}
          </button>
          {openMenus.includes(item.id) && (
            <div className="ml-8 mt-1 space-y-1">
              {item.submenu.map((sub) =>
                sub.enabled ? (
                  <Link
                    key={sub.id}
                    href={sub.href}
                    onClick={closeMobile}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive(sub.href)
                        ? "bg-orange-50 text-orange-700 font-medium"
                        : "text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
                    }`}
                  >
                    {sub.icon && <sub.icon className="h-4 w-4" />}
                    <span>{sub.label}</span>
                  </Link>
                ) : (
                  <div key={sub.id} className="relative group">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-dashboard-muted cursor-not-allowed">
                      {sub.icon && <sub.icon className="h-4 w-4" />}
                      <span>{sub.label}</span>
                    </div>
                    <div className="absolute left-full top-0 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 ml-2">
                      Coming Soon
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      );
    }

    if (!item.enabled && item.href !== "/") {
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

    const showNewBadge =
      item.showNewBadgeUntil &&
      new Date() <= new Date(item.showNewBadgeUntil + "T23:59:59");

    return (
      <Link
        key={item.id}
        href={item.href!}
        onClick={closeMobile}
        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive(item.href!)
            ? "bg-brand-bg-primary text-white font-medium shadow-sm"
            : "text-dashboard-heading hover:bg-dashboard-bg"
        }`}
      >
        <item.icon className="h-5 w-5" />
        <span className="font-medium">{item.label}</span>
        {showNewBadge && (
          <span
            className={`ml-auto shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
              isActive(item.href!)
                ? "bg-white/25 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            New
          </span>
        )}
      </Link>
    );
  };

  const closeMobile = () => setIsMobileMenuOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Mobile close header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-dashboard-border bg-dashboard-surface">
        <span className="text-sm font-semibold text-dashboard-heading">
          Admin Menu
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

      {/* Admin Profile */}
      <div className="p-4 bg-dashboard-surface border-b border-dashboard-border">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-lg font-semibold relative">
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
              <ShieldCheck className="h-2 w-2 text-white" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-dashboard-heading truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-orange-600 font-medium capitalize">
              {user?.role || "admin"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-3">
            Admin Panel
          </h3>
          <nav className="space-y-1">
            {adminMenuItems.map((item) => renderMenuItem(item, closeMobile))}
          </nav>
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="flex-shrink-0 p-4 border-t border-dashboard-border bg-dashboard-surface">
        <h3 className="text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-3">
          Other
        </h3>
        <nav className="space-y-1">
          {adminOtherMenuItems.map((item) => renderMenuItem(item, closeMobile))}
          <button
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
      {/* Mobile hamburger */}
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

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[45] touch-none"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-dashboard-surface border-r border-dashboard-border h-screen sticky top-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 w-[min(288px,85vw)] max-w-full h-dvh max-h-screen z-50 transform transition-transform duration-300 ease-out overscroll-contain ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation menu"
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
