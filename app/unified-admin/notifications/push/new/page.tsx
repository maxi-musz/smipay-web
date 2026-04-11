"use client";

import { useRouter } from "next/navigation";
import { PushBroadcastBuilderForm } from "../../_components/PushBroadcastBuilderForm";

export default function NewPushBroadcastPage() {
  const router = useRouter();

  return (
    <PushBroadcastBuilderForm
      onCreated={(id) => router.push(`/unified-admin/notifications/push/${id}`)}
    />
  );
}
