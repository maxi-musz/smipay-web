"use client";

import { cn } from "@/lib/utils";
import { getNetworkLogo } from "@/lib/network-logos";
import type { VtpassCableService } from "@/types/vtpass/vtu/vtpass-cable";
import Image from "next/image";

interface ProviderSelectorProps {
  services: VtpassCableService[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
  isLoading?: boolean;
}

export function ProviderSelector({
  services,
  selectedServiceId,
  onSelect,
  isLoading = false,
}: ProviderSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-[280px] sm:max-w-none mx-auto sm:mx-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-square w-full max-w-[56px] sm:max-w-[64px] mx-auto rounded-full border border-dashboard-border/80 animate-pulse bg-dashboard-bg/60 flex items-center justify-center"
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-dashboard-border/60" />
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashboard-border/80 bg-dashboard-bg/50 py-8 text-center">
        <p className="text-sm text-dashboard-muted">No cable TV providers available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-[280px] sm:max-w-none mx-auto sm:mx-0">
      {services.map((service) => {
        const isSelected = selectedServiceId === service.serviceID;
        const localLogo = getNetworkLogo(service.serviceID);
        const logoPath = localLogo || service.image;

        return (
          <button
            key={service.serviceID}
            type="button"
            onClick={() => onSelect(service.serviceID)}
            disabled={isLoading}
            title={service.name.replace(" Subscription", "")}
            className={cn(
              "aspect-square w-full max-w-[56px] sm:max-w-[64px] min-w-0 mx-auto rounded-full border-2 transition-all duration-200 flex items-center justify-center p-1.5 sm:p-2 overflow-hidden",
              "min-h-[44px] touch-manipulation",
              "focus:outline-none focus:ring-2 focus:ring-dashboard-accent focus:ring-offset-2 focus:ring-offset-dashboard-surface",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "active:scale-[0.98]",
              isSelected
                ? "border-brand-bg-primary bg-brand-bg-primary/10 shadow-sm"
                : "border-dashboard-border/80 bg-dashboard-surface hover:border-dashboard-border hover:shadow-sm"
            )}
          >
            {logoPath ? (
              <div className="relative h-full w-full min-h-8 min-w-8 sm:min-h-9 sm:min-w-9 rounded-full overflow-hidden">
                <Image
                  src={logoPath}
                  alt={service.name}
                  fill
                  className="object-cover"
                  unoptimized={!localLogo}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="h-full w-full min-h-8 min-w-8 rounded-full bg-dashboard-border/50 flex items-center justify-center"><span class="text-lg sm:text-xl">📺</span></div>';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-dashboard-border/50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">📺</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
