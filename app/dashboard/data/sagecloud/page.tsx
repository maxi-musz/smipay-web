"use client";

import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SagecloudDataPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 sm:h-9 sm:w-9">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight">
                Buy Data
              </h1>
              <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
                Purchase data bundles via Sagecloud
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="hidden sm:block">
          <WalletAnalysisCards />
        </div>
        
        <div className="max-w-4xl">

          {/* Provider Content */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-100">
            <div className="text-center py-8 sm:py-12">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-purple-100 mb-3 sm:mb-4">
                <Zap className="h-7 w-7 sm:h-10 sm:w-10 text-purple-600" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-brand-text-primary mb-2">
                Sagecloud Data Provider
              </h2>
              <p className="text-sm sm:text-base text-brand-text-secondary mb-4 sm:mb-6">
                This is the Sagecloud data purchase page. The form and fields will be implemented based on Sagecloud API requirements.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-50 rounded-full">
                <span className="text-xs sm:text-sm font-semibold text-purple-700">
                  Provider: Sagecloud
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
