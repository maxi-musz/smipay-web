"use client";

import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SagecloudEducationPage() {
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
            <div>
              <h1 className="text-2xl font-bold text-brand-text-primary flex items-center gap-2">
                <GraduationCap className="h-6 w-6" />
                Education
              </h1>
              <p className="text-sm text-brand-text-secondary mt-1">
                Purchase education services using Sagecloud provider
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
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-100">
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Education Services
              </h2>
              <p className="text-brand-text-secondary">
                Education services will be available here soon. This will include WAEC, JAMB, and other educational services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
