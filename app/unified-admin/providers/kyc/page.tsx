"use client";

import { useState } from "react";
import { KycProviderOverview } from "./_components/KycProviderOverview";
import { BvnVerificationPanel } from "./_components/BvnVerificationPanel";

/**
 * KYC Providers — rendered under the shared Providers section nav, matching the
 * SMS/Email pages: provider overview (balance, analytics, test) → full
 * configuration. (The active registration flow lives in Settings → Security.)
 */
export default function KycProvidersPage() {
  const [providerConfigured, setProviderConfigured] = useState(false);

  return (
    <div className="space-y-4 pb-8">
      <KycProviderOverview providerConfigured={providerConfigured} />
      <BvnVerificationPanel onProviderConfigured={setProviderConfigured} />
    </div>
  );
}
