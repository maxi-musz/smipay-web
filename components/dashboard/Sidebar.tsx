"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Globe,
  Smartphone,
  Tv,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Phone,
  Wifi,
  Satellite,
  Monitor,
  GraduationCap,
  Zap,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { getNetworkLogo } from "@/lib/network-logos";
import Image from "next/image";

interface SubMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  logoId?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  submenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "vtu",
    label: "VTU",
    icon: Phone,
    submenu: [
      { id: "buy-airtime", label: "Buy Airtime", href: "/dashboard/airtime", icon: Smartphone },
      { id: "buy-data", label: "Buy Data", href: "/dashboard/data", icon: Wifi },
    ],
  },
  {
    id: "cable-tv",
    label: "Cable TV",
    icon: Tv,
    submenu: [
      { id: "dstv", label: "DSTV", href: "/dashboard/cabletv?provider=dstv", icon: Satellite },
      { id: "gotv", label: "GOTV", href: "/dashboard/cabletv?provider=gotv", icon: Monitor },
      { id: "startimes", label: "STARTIMES", href: "/dashboard/cabletv?provider=startimes", icon: Tv },
      { id: "showmax", label: "SHOWMAX", href: "/dashboard/cabletv?provider=showmax", icon: Monitor },
    ],
  },
  {
    id: "electricity",
    label: "Electricity",
    icon: Zap,
    submenu: [
      { id: "ikeja-electric", label: "Ikeja (IKEDC)", href: "/dashboard/electricity/vtpass?provider=ikeja-electric", logoId: "ikeja-electric" },
      { id: "eko-electric", label: "Eko (EKEDC)", href: "/dashboard/electricity/vtpass?provider=eko-electric", logoId: "eko-electric" },
      { id: "abuja-electric", label: "Abuja (AEDC)", href: "/dashboard/electricity/vtpass?provider=abuja-electric", logoId: "abuja-electric" },
      { id: "ibadan-electric", label: "Ibadan (IBEDC)", href: "/dashboard/electricity/vtpass?provider=ibadan-electric", logoId: "ibadan-electric" },
      { id: "kano-electric", label: "Kano (KEDCO)", href: "/dashboard/electricity/vtpass?provider=kano-electric", logoId: "kano-electric" },
      { id: "portharcourt-electric", label: "PH (PHED)", href: "/dashboard/electricity/vtpass?provider=portharcourt-electric", logoId: "portharcourt-electric" },
      { id: "enugu-electric", label: "Enugu (EEDC)", href: "/dashboard/electricity/vtpass?provider=enugu-electric", logoId: "enugu-electric" },
      { id: "benin-electric", label: "Benin (BEDC)", href: "/dashboard/electricity/vtpass?provider=benin-electric", logoId: "benin-electric" },
      { id: "kaduna-electric", label: "Kaduna (KAEDCO)", href: "/dashboard/electricity/vtpass?provider=kaduna-electric", logoId: "kaduna-electric" },
      { id: "jos-electric", label: "Jos (JED)", href: "/dashboard/electricity/vtpass?provider=jos-electric", logoId: "jos-electric" },
      { id: "yola-electric", label: "Yola (YEDC)", href: "/dashboard/electricity/vtpass?provider=yola-electric", logoId: "yola-electric" },
      { id: "aba-electric", label: "Aba Electric", href: "/dashboard/electricity/vtpass?provider=aba-electric", logoId: "aba-electric" },
    ],
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    href: "/dashboard/education/vtpass",
  },
  // {
  //   id: "refer",
  //   label: "Refer and Earn",
  //   icon: Users,
  //   href: "/dashboard/referrals",
  // },
];

const otherMenuItems: MenuItem[] = [
  {
    id: "account-settings",
    label: "Account Settings",
    icon: Settings,
    submenu: [
      // { id: "api-settings", label: "Api Settings", href: "/dashboard/settings-api" },
      { id: "profile", label: "Profile", href: "/dashboard/settings-profile" },
      // { id: "update-profile", label: "Update Profile", href: "/dashboard/settings-update" },
      // { id: "compliance", label: "Compliance", href: "/dashboard/settings-compliance" },
      // { id: "change-pin", label: "Change Pin", href: "/dashboard/settings-pin" },
    ],
  },
  {
    id: "website-services",
    label: "Website Services",
    icon: Globe,
    href: "/",
  },
  // {
  //   id: "api-docs",
  //   label: "API Documentation",
  //   icon: FileCode,
  //   href: "/dashboard/api-docs",
  // },
  // {
  //   id: "whatsapp",
  //   label: "Join Whatsapp Group",
  //   icon: MessageSquare,
  //   href: "https://wa.me/",
  // },
];

const ENABLED_ROUTES = [
  "/dashboard",
  "/dashboard/airtime",
  "/dashboard/data",
  "/dashboard/cabletv",
  "/dashboard/electricity",
  "/dashboard/education",
  "/dashboard/settings-profile",
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(["vtu"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { dashboardData } = useDashboard();

  useEffect(() => {
    const open = () => setIsMobileMenuOpen(true);
    window.addEventListener("open-mobile-sidebar", open);
    return () => window.removeEventListener("open-mobile-sidebar", open);
  }, []);

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
        : [...prev, menuId]
    );
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isRouteEnabled = (href: string) => {
    if (href.startsWith("/dashboard/cabletv")) {
      return ENABLED_ROUTES.includes("/dashboard/cabletv");
    }
    if (href.startsWith("/dashboard/electricity")) {
      return ENABLED_ROUTES.includes("/dashboard/electricity");
    }
    if (href.startsWith("/dashboard/education")) {
      return ENABLED_ROUTES.includes("/dashboard/education");
    }
    return ENABLED_ROUTES.includes(href);
  };

  const isSubitemActive = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname.startsWith(path)) {
      if (query) {
        const params = new URLSearchParams(query);
        const provider = params.get("provider");
        return provider ? pathname.startsWith(path) && typeof window !== "undefined" && window.location.search.includes(`provider=${provider}`) : true;
      }
      return pathname === path;
    }
    return false;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Mobile: in-panel header with close button */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-dashboard-border bg-dashboard-surface shrink-0">
        <span className="text-xs font-semibold text-dashboard-heading">Menu</span>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 -m-2 rounded-lg hover:bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Profile */}
      <div className="p-3 bg-dashboard-surface border-b border-dashboard-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold relative shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-dashboard-heading truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[11px] text-dashboard-muted">
              Balance: <span className="font-semibold text-emerald-600">{"\u20A6"}{(dashboardData?.wallet_card?.current_balance) || "0.00"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Menu — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 lg:p-4">
        <h3 className="text-[10px] lg:text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
          Main Menu
        </h3>
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm rounded-lg hover:bg-dashboard-bg text-dashboard-heading transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-dashboard-muted" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {openMenus.includes(item.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-dashboard-muted" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-dashboard-muted" />
                    )}
                  </button>
                  {openMenus.includes(item.id) && (
                    <div className="ml-7 mt-0.5 space-y-0.5">
                      {item.submenu.map((subitem) => {
                        const enabled = isRouteEnabled(subitem.href);
                        const SubIcon = subitem.icon;
                        const logoSrc = subitem.logoId ? getNetworkLogo(subitem.logoId) : null;
                        const iconEl = logoSrc ? (
                          <Image src={logoSrc} alt={subitem.label} width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
                        ) : SubIcon ? (
                          <SubIcon className="h-3.5 w-3.5" />
                        ) : null;
                        return enabled ? (
                          <Link
                            key={subitem.id}
                            href={subitem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg transition-colors ${
                              isSubitemActive(subitem.href)
                                ? "bg-orange-50 text-orange-700 font-medium"
                                : "text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
                            }`}
                          >
                            {iconEl}
                            <span>{subitem.label}</span>
                          </Link>
                        ) : (
                          <div
                            key={subitem.id}
                            className="relative group"
                          >
                            <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg text-dashboard-muted cursor-not-allowed">
                              {iconEl}
                              <span>{subitem.label}</span>
                            </div>
                            <div className="absolute left-full top-0 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 ml-2">
                              Coming Soon
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : isRouteEnabled(item.href!) ? (
                <Link
                  href={item.href!}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-brand-bg-primary text-white font-medium shadow-sm"
                      : "text-dashboard-heading hover:bg-dashboard-bg"
                  }`}
                >
                  <item.icon className="h-4 w-4 lg:h-4.5 lg:w-4.5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ) : (
                <div className="relative group">
                  <div className="flex items-center gap-2.5 px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm rounded-lg text-dashboard-muted cursor-not-allowed">
                    <item.icon className="h-4 w-4 lg:h-4.5 lg:w-4.5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="absolute left-0 top-0 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 ml-2">
                    Coming Soon
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Other Menu — fixed at bottom */}
      <div className="shrink-0 p-3 lg:p-4 border-t border-dashboard-border bg-dashboard-surface">
        <h3 className="text-[10px] lg:text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
          Other Menu
        </h3>
        <nav className="space-y-0.5">
          {otherMenuItems.map((item) => (
            <div key={item.id}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm rounded-lg hover:bg-dashboard-bg text-dashboard-heading transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-dashboard-muted" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {openMenus.includes(item.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-dashboard-muted" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-dashboard-muted" />
                    )}
                  </button>
                  {openMenus.includes(item.id) && (
                    <div className="ml-7 mt-0.5 space-y-0.5">
                      {item.submenu.map((subitem) => {
                        const enabled = isRouteEnabled(subitem.href);
                        const SubIcon = subitem.icon;
                        const logoSrc = subitem.logoId ? getNetworkLogo(subitem.logoId) : null;
                        const iconEl = logoSrc ? (
                          <Image src={logoSrc} alt={subitem.label} width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
                        ) : SubIcon ? (
                          <SubIcon className="h-3.5 w-3.5" />
                        ) : null;
                        return enabled ? (
                          <Link
                            key={subitem.id}
                            href={subitem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg transition-colors ${
                              pathname === subitem.href
                                ? "bg-orange-50 text-orange-700 font-medium"
                                : "text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
                            }`}
                          >
                            {iconEl}
                            <span>{subitem.label}</span>
                          </Link>
                        ) : (
                          <div
                            key={subitem.id}
                            className="relative group"
                          >
                            <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg text-dashboard-muted cursor-not-allowed">
                              {iconEl}
                              <span>{subitem.label}</span>
                            </div>
                            <div className="absolute left-full top-0 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 ml-2">
                              Coming Soon
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : item.href === "/" ? (
                  <Link
                  href={item.href!}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm rounded-lg text-dashboard-heading hover:bg-dashboard-bg transition-colors"
                >
                  <item.icon className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-dashboard-muted" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ) : (
                <div className="relative group">
                  <div className="flex items-center gap-2.5 px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm rounded-lg text-dashboard-muted cursor-not-allowed">
                    <item.icon className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-dashboard-muted" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="absolute left-0 top-0 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 ml-2">
                    Coming Soon
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 lg:h-4.5 lg:w-4.5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[45] touch-none"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Desktop Sidebar — shrink-0 prevents flex from squishing it */}
      <aside className="hidden lg:block lg:shrink-0 w-72 bg-dashboard-surface border-r border-dashboard-border h-screen sticky top-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 w-[min(288px,85vw)] max-w-full h-dvh max-h-screen z-50 transform transition-transform duration-300 ease-out overscroll-contain ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
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
