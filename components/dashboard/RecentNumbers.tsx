"use client";

import Image from "next/image";
import { getNetworkLogo } from "@/lib/network-logos";
import { getRecentEntries, type ServiceType, type RecentEntry } from "@/lib/recent-numbers";
import { Clock, X } from "lucide-react";
import { useState, useEffect } from "react";

const FRIENDLY_NAMES: Record<string, string> = {
  mtn: "MTN",
  glo: "Glo",
  airtel: "Airtel",
  etisalat: "9mobile",
  "mtn-data": "MTN",
  "glo-data": "Glo",
  "airtel-data": "Airtel",
  "etisalat-data": "9mobile",
  dstv: "DStv",
  gotv: "GOtv",
  startimes: "StarTimes",
  showmax: "Showmax",
  "ikeja-electric": "Ikeja",
  "eko-electric": "Eko",
  "kano-electric": "Kano",
  "portharcourt-electric": "PH",
  "jos-electric": "Jos",
  "ibadan-electric": "Ibadan",
  "kaduna-electric": "Kaduna",
  "abuja-electric": "Abuja",
  "enugu-electric": "Enugu",
  "benin-electric": "Benin",
  "aba-electric": "Aba",
  "yola-electric": "Yola",
};

function formatNumber(num: string): string {
  if (num.length === 11 && num.startsWith("0")) {
    return `${num.slice(0, 4)} ${num.slice(4, 7)} ${num.slice(7)}`;
  }
  return num;
}

interface RecentNumbersProps {
  type: ServiceType;
  onSelect: (entry: RecentEntry) => void;
}

export function RecentNumbers({ type, onSelect }: RecentNumbersProps) {
  const [entries, setEntries] = useState<RecentEntry[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setEntries(getRecentEntries(type));
  }, [type]);

  if (dismissed || entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-dashboard-muted" />
          <span className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider">
            Recent
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded text-dashboard-muted/60 hover:text-dashboard-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {entries.map((entry, i) => {
          const logo = getNetworkLogo(entry.serviceID);
          const name = FRIENDLY_NAMES[entry.serviceID.toLowerCase()] || entry.serviceID;

          return (
            <button
              key={`${entry.serviceID}-${entry.number}-${i}`}
              type="button"
              onClick={() => onSelect(entry)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashboard-border/70 bg-dashboard-bg/60 hover:bg-dashboard-bg hover:border-brand-bg-primary/30 transition-all active:scale-[0.97] touch-manipulation shrink-0"
            >
              {logo ? (
                <div className="relative h-5 w-5 rounded-md overflow-hidden ring-1 ring-dashboard-border/30 shrink-0">
                  <Image src={logo} alt={name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-md bg-dashboard-border/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-dashboard-muted">{name.charAt(0)}</span>
                </div>
              )}
              <span className="text-xs font-medium text-dashboard-heading tabular-nums whitespace-nowrap">
                {formatNumber(entry.number)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
