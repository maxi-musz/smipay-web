"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const getProvider = () => {
  const provider = (process.env.NEXT_PUBLIC_AIRTIME_PROVIDER || "vtpass")
    .toLowerCase()
    .trim();
  const validProviders = ["vtpass", "sagecloud"];
  return validProviders.includes(provider) ? provider : "vtpass";
};

function AirtimeSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header skeleton */}
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-dashboard-border/50 animate-pulse shrink-0" />
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-dashboard-border/50 animate-pulse shrink-0" />
          <div className="flex-1">
            <div className="h-5 w-28 bg-dashboard-border/60 rounded animate-pulse" />
            <div className="h-3 w-40 mt-1.5 bg-dashboard-border/40 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-5 sm:space-y-6">
        {/* Wallet card skeleton */}
        <div className="max-w-xl w-full">
          <div className="rounded-2xl h-16 animate-pulse" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }} />
        </div>

        {/* Form card skeleton with spinner overlay */}
        <div className="max-w-xl w-full">
          <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent" />
            </div>
            {/* Network selector skeleton */}
            <div className="h-4 w-32 bg-dashboard-border/50 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-dashboard-border/40 animate-pulse" />
              ))}
            </div>
            {/* Amount + phone skeleton */}
            <div className="h-4 w-28 bg-dashboard-border/50 rounded animate-pulse mt-4" />
            <div className="h-11 w-full bg-dashboard-border/40 rounded-xl animate-pulse" />
            <div className="h-4 w-24 bg-dashboard-border/50 rounded animate-pulse" />
            <div className="h-11 w-full bg-dashboard-border/40 rounded-xl animate-pulse" />
            {/* Button skeleton */}
            <div className="h-11 w-full bg-dashboard-border/50 rounded-xl animate-pulse mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

const VtpassAirtime = dynamic(
  () => import("./vtpass/page"),
  { loading: () => <AirtimeSkeleton /> }
);

const SagecloudAirtime = dynamic(
  () => import("./sagecloud/page"),
  { loading: () => <AirtimeSkeleton /> }
);

export default function AirtimePage() {
  const provider = getProvider();
  if (provider === "sagecloud") return <SagecloudAirtime />;
  return <VtpassAirtime />;
}
