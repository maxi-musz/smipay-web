"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MailPlus } from "lucide-react";
import { CampaignBuilderForm } from "../_components/CampaignBuilderForm";

function NewNotificationCampaignInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCampaignId = searchParams.get("from")?.trim() || undefined;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/unified-admin/notifications"
              className="h-9 w-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg flex items-center justify-center text-dashboard-heading hover:bg-dashboard-border/30 transition-colors"
              aria-label="Back to campaigns"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <MailPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                {fromCampaignId ? "Send email again" : "New Email Campaign"}
              </h1>
              <p className="text-xs text-dashboard-muted">
                {fromCampaignId
                  ? "Review subject, body, and audience — then preview and send."
                  : "Compose a campaign, preview audience, then send or schedule"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <CampaignBuilderForm
          cloneSourceCampaignId={fromCampaignId}
          onCreated={(campaignId) => {
            router.push(`/unified-admin/notifications/${campaignId}`);
          }}
        />
      </div>
    </div>
  );
}

export default function NewNotificationCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dashboard-bg flex items-center justify-center text-sm text-dashboard-muted">
          Loading…
        </div>
      }
    >
      <NewNotificationCampaignInner />
    </Suspense>
  );
}
