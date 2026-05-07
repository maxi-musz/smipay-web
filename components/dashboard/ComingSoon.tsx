"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";

interface ComingSoonProps {
  /** Feature name shown in the heading (e.g. "Cable TV", "Transaction History") */
  featureName: string;
}

export function ComingSoon({ featureName }: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-dashboard-bg flex flex-col">
      <div className="border-b border-dashboard-border/60 bg-dashboard-surface sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-2 text-dashboard-heading"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-6">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-dashboard-heading mb-2">
            {featureName}
          </h1>
          <p className="text-dashboard-muted text-sm sm:text-base mb-6">
            This feature is coming soon. We&apos;re working on it. For now, you can use Airtime and Data from the dashboard.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
