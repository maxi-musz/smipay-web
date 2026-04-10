"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { VtpassCableVariation } from "@/types/vtpass/vtu/vtpass-cable";
import { Loader2, Star, ChevronRight } from "lucide-react";

interface PlanSelectorProps {
  variationCodes: {
    ServiceName: string;
    serviceID: string;
    variations: VtpassCableVariation[];
    varations?: VtpassCableVariation[];
  } | null;
  isLoading: boolean;
  error: string | null;
  onSelectPlan: (variation: VtpassCableVariation) => void;
  selectedVariationCode?: string | null;
}

const ROW_ACCENTS = [
  "border-l-sky-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-teal-500",
];

const FAVORITES_STORAGE_KEY = "cable-plan-favorites";

export function PlanSelector({
  variationCodes,
  isLoading,
  error,
  onSelectPlan,
  selectedVariationCode,
}: PlanSelectorProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (saved) {
      try {
        queueMicrotask(() => setFavorites(new Set(JSON.parse(saved))));
      } catch {
        queueMicrotask(() => setFavorites(new Set()));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (variationCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(variationCode)) next.delete(variationCode);
      else next.add(variationCode);
      return next;
    });
  };

  const isFavorite = (variationCode: string) => favorites.has(variationCode);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mb-3" />
        <p className="text-xs sm:text-sm text-dashboard-muted">Loading subscription plans…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
          <p className="text-red-600 text-xs sm:text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!variationCodes) {
    return (
      <div className="text-center py-10">
        <p className="text-xs sm:text-sm text-dashboard-muted">No subscription plans available.</p>
      </div>
    );
  }

  const allVariations: VtpassCableVariation[] =
    variationCodes.variations?.length > 0
      ? variationCodes.variations
      : variationCodes.varations || [];

  if (allVariations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-xs sm:text-sm text-dashboard-muted">No subscription plans available.</p>
      </div>
    );
  }

  const displayedVariations = showFavoritesOnly
    ? allVariations.filter((v) => isFavorite(v.variation_code))
    : allVariations;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-dashboard-heading whitespace-nowrap">
            Select plan
          </h2>
          {favorites.size > 0 && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                "px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap touch-manipulation",
                showFavoritesOnly
                  ? "bg-brand-bg-primary text-white shadow-sm"
                  : "bg-dashboard-bg text-dashboard-heading hover:bg-dashboard-border/60"
              )}
            >
              <Star className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", showFavoritesOnly ? "fill-white" : "fill-yellow-400 text-yellow-400")} />
              <span className="hidden min-[400px]:inline">Favourites</span> ({favorites.size})
            </button>
          )}
        </div>
      </div>

      {/* Plans */}
      {displayedVariations.length > 0 ? (
        <div className="space-y-1.5 sm:space-y-2">
          {displayedVariations.map((variation, index) => {
            const isSelected = selectedVariationCode === variation.variation_code;
            const amount = parseFloat(variation.variation_amount);
            const accentClass = ROW_ACCENTS[index % ROW_ACCENTS.length];

            return (
              <button
                key={variation.variation_code}
                onClick={() => onSelectPlan(variation)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl border-l-[3px] border transition-all text-left touch-manipulation",
                  "hover:shadow-sm active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-dashboard-accent focus:ring-offset-1 focus:ring-offset-dashboard-surface",
                  isSelected
                    ? "border-brand-bg-primary border-l-brand-bg-primary bg-brand-bg-primary/8 shadow-sm"
                    : `border-dashboard-border/60 ${accentClass} bg-dashboard-surface hover:bg-dashboard-bg/60`
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[11px] sm:text-xs font-medium leading-snug",
                    isSelected ? "text-brand-bg-primary" : "text-dashboard-heading"
                  )}>
                    {variation.name}
                  </p>
                </div>

                <p className="text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap">
                  <span className={cn(isSelected ? "text-brand-bg-primary" : "text-brand-bg-primary/70")}>₦</span>
                  <span className={cn(isSelected ? "text-brand-bg-primary" : "text-dashboard-heading")}>{amount.toLocaleString()}</span>
                </p>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => toggleFavorite(variation.variation_code, e)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFavorite(variation.variation_code, e as any); }}
                  className="p-1.5 -mr-1 rounded-lg hover:bg-dashboard-border/40 transition-colors touch-manipulation shrink-0 cursor-pointer"
                  title={isFavorite(variation.variation_code) ? "Remove from favourites" : "Add to favourites"}
                >
                  <Star className={cn("h-4 w-4 transition-colors", isFavorite(variation.variation_code) ? "fill-yellow-400 text-yellow-400" : "text-dashboard-muted/50 hover:text-yellow-400")} />
                </span>

                <ChevronRight className={cn("h-4 w-4 shrink-0", isSelected ? "text-brand-bg-primary" : "text-dashboard-muted/40")} />
              </button>
            );
          })}
        </div>
      ) : showFavoritesOnly ? (
        <div className="text-center py-10">
          <Star className="h-8 w-8 text-dashboard-border mx-auto mb-3" />
          <p className="text-sm text-dashboard-heading font-medium">No favourite plans yet</p>
          <p className="text-xs text-dashboard-muted mt-1">Tap the star on any plan to save it</p>
        </div>
      ) : (
        <div className="text-center py-8 text-dashboard-muted">
          <p className="text-xs sm:text-sm">No plans available.</p>
        </div>
      )}
    </div>
  );
}
