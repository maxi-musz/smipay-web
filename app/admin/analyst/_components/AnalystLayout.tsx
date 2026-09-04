"use client";

import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";

import { SessionExpired } from "@/components/auth/SessionExpired";
import { SessionWarning } from "@/components/auth/SessionWarning";
import { useActivityTracker } from "@/hooks/useActivityTracker";

import AnalystSidebar from "./AnalystSidebar";
import {
  AnalystPanelTabs,
  type AnalystPanelId,
} from "./AnalystPanelTabs";

export default function AnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePanel, setActivePanel] = useState<AnalystPanelId>("general");
  const {
    showWarning,
    sessionExpired,
    timeRemaining,
    extendSession,
    handleLogout,
    acknowledgeExpiry,
  } = useActivityTracker();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
          <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
        </div>
      }
    >
      <div className="flex h-screen flex-col overflow-hidden bg-dashboard-bg">
        <AnalystPanelTabs active={activePanel} onChange={setActivePanel} />

        {activePanel === "general" ? (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <AnalystSidebar />
            <main className="admin-content-area min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto pt-4 pr-14 lg:pt-0 lg:pr-0">
              {children}
            </main>
          </div>
        ) : null}
      </div>

      <SessionWarning
        showWarning={showWarning && !sessionExpired}
        timeRemaining={timeRemaining}
        onExtend={extendSession}
        onLogout={() => handleLogout("You have been logged out.")}
      />

      <SessionExpired
        show={sessionExpired}
        onAcknowledge={acknowledgeExpiry}
      />
    </Suspense>
  );
}
