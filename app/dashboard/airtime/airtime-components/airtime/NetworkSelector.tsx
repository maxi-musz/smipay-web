"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getNetworkLogo } from "@/lib/network-logos";
import type { VtpassService } from "@/services/vtpass/vtu/vtpass-airtime-api";
import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";

interface NetworkSelectorProps {
  services: VtpassService[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
  isLoading?: boolean;
}

function getDisplayName(service: VtpassService) {
  return service.name.replace(" Airtime", "").replace("VTpass ", "");
}

export function NetworkSelector({
  services,
  selectedServiceId,
  onSelect,
  isLoading = false,
}: NetworkSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = services.find((s) => s.serviceID === selectedServiceId);
  const selectedLogo = selected
    ? getNetworkLogo(selected.serviceID) || selected.image
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-12">
        <div className="h-9 w-9 rounded-xl bg-dashboard-border/50 animate-pulse shrink-0" />
        <div className="h-3 w-10 rounded bg-dashboard-border/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 h-12 px-2 rounded-xl transition-all touch-manipulation",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg-primary/40",
          open
            ? "bg-dashboard-bg ring-1 ring-dashboard-border"
            : "hover:bg-dashboard-bg/60"
        )}
      >
        {selectedLogo ? (
          <div className="relative h-8 w-8 rounded-lg overflow-hidden ring-1 ring-dashboard-border/40 shrink-0">
            <Image
              src={selectedLogo}
              alt={selected ? getDisplayName(selected) : ""}
              fill
              className="object-cover"
              unoptimized={!getNetworkLogo(selected?.serviceID ?? "")}
            />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-lg bg-dashboard-border/30 flex items-center justify-center shrink-0">
            <span className="text-sm">📱</span>
          </div>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-dashboard-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && services.length > 0 && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] rounded-xl border border-dashboard-border/80 bg-dashboard-surface shadow-xl shadow-black/8 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {services.map((service) => {
            const logo = getNetworkLogo(service.serviceID) || service.image;
            const isActive = selectedServiceId === service.serviceID;
            const name = getDisplayName(service);

            return (
              <button
                key={service.serviceID}
                type="button"
                onClick={() => {
                  onSelect(service.serviceID);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors touch-manipulation",
                  isActive
                    ? "bg-brand-bg-primary/[0.06]"
                    : "hover:bg-dashboard-bg/70"
                )}
              >
                <div className="relative h-7 w-7 rounded-lg overflow-hidden ring-1 ring-dashboard-border/30 shrink-0">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={name}
                      fill
                      className="object-cover"
                      unoptimized={!getNetworkLogo(service.serviceID)}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-dashboard-border/20 text-xs">
                      📱
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[13px] font-medium flex-1",
                    isActive ? "text-brand-bg-primary" : "text-dashboard-heading"
                  )}
                >
                  {name}
                </span>
                {isActive && (
                  <Check className="h-4 w-4 text-brand-bg-primary shrink-0" strokeWidth={2.5} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
