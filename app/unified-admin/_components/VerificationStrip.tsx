"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import {
  PctBar,
  type BreakdownTone,
} from "@/app/unified-admin/_components/VerificationBreakdownList";
import { formatPct, pct, type VerificationBreakdown } from "@/types/admin/verification";
import type { UserView } from "@/types/admin/users";

interface Tile {
  key: string;
  label: string;
  value: number;
  tone: BreakdownTone;
  view?: UserView;
  muted?: boolean;
  hint?: string;
}

function tiles(v: VerificationBreakdown): Tile[] {
  return [
    { key: "phone", label: "Phone verified", value: v.phone_verified, tone: "positive", view: "phone" },
    { key: "bvn", label: "BVN verified", value: v.bvn_verified, tone: "positive", view: "bvn" },
    { key: "phone_bvn", label: "Phone + BVN", value: v.phone_and_bvn, tone: "positive", view: "phone_bvn" },
    {
      key: "not_phone",
      label: "Not phone-verified",
      value: Math.max(0, v.total - v.phone_verified),
      tone: "warning",
      view: "not_phone",
    },
    {
      key: "email",
      label: "Email verified",
      value: v.email_verified,
      tone: "brand",
      muted: true,
      hint: "Set at sign-up for everyone",
    },
  ];
}

function TileBody({ tile, total }: { tile: Tile; total: number }) {
  const share = pct(tile.value, total);
  return (
    <>
      <span
        className={`block text-[11px] font-medium leading-tight ${
          tile.muted ? "text-dashboard-muted/70" : "text-dashboard-muted"
        }`}
      >
        {tile.label}
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <span
          className={`text-lg font-bold tabular-nums leading-none ${
            tile.muted ? "text-dashboard-muted" : "text-dashboard-heading"
          }`}
        >
          {tile.value.toLocaleString()}
        </span>
        <span className="text-[11px] tabular-nums text-dashboard-muted">{formatPct(share)}</span>
      </span>
      <PctBar value={share} tone={tile.tone} muted={tile.muted} className="mt-2" />
      {tile.hint && (
        <span className="mt-1.5 block text-[10px] text-dashboard-muted/70">{tile.hint}</span>
      )}
    </>
  );
}

export function VerificationStrip({
  verification,
  newToday,
  title = "User verification",
  index = 0,
}: {
  verification: VerificationBreakdown;
  newToday?: number;
  title?: string;
  index?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 * index }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 text-dashboard-muted shrink-0" aria-hidden />
          <h2 className="text-sm font-semibold text-dashboard-heading">{title}</h2>
          <span className="text-[11px] text-dashboard-muted tabular-nums truncate">
            of {verification.total.toLocaleString()} customers
            {newToday !== undefined ? ` · +${newToday.toLocaleString()} today` : ""}
          </span>
        </div>
        <Link
          href="/unified-admin/users"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-bg-primary hover:underline"
        >
          Open users
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {tiles(verification).map((tile) =>
          tile.view ? (
            <Link
              key={tile.key}
              href={`/unified-admin/users?view=${tile.view}`}
              title={`Open ${tile.label.toLowerCase()} customers`}
              className="block rounded-lg border border-dashboard-border/50 bg-dashboard-bg/40 p-3 hover:border-brand-bg-primary/40 hover:bg-dashboard-bg transition-colors"
            >
              <TileBody tile={tile} total={verification.total} />
            </Link>
          ) : (
            <div
              key={tile.key}
              className="rounded-lg border border-dashboard-border/40 bg-dashboard-bg/20 p-3"
            >
              <TileBody tile={tile} total={verification.total} />
            </div>
          ),
        )}
      </div>
    </motion.section>
  );
}
