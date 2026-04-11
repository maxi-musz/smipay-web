"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PushBroadcastBuilderForm } from "../../_components/PushBroadcastBuilderForm";

function NewPushBroadcastInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromBroadcastId = searchParams.get("from")?.trim() || undefined;

  return (
    <PushBroadcastBuilderForm
      onCreated={(id) => router.push(`/unified-admin/notifications/push/${id}`)}
      cloneSourceBroadcastId={fromBroadcastId}
    />
  );
}

export default function NewPushBroadcastPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dashboard-bg flex items-center justify-center text-sm text-dashboard-muted">
          Loading…
        </div>
      }
    >
      <NewPushBroadcastInner />
    </Suspense>
  );
}
