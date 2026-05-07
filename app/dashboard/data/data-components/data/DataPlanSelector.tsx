"use client";

import React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { VtpassDataVariation, VtpassDataVariationCategory } from "@/types/vtpass/vtu/vtpass-data";
import { Loader2, Wifi, Calendar, Moon, Users, Router, Star, ChevronRight } from "lucide-react";

interface DataPlanSelectorProps {
  variationCodes: {
    ServiceName: string;
    serviceID: string;
    variations_categorized: Record<string, VtpassDataVariationCategory>;
  } | null;
  isLoading: boolean;
  error: string | null;
  onSelectPlan: (variation: VtpassDataVariation) => void;
  selectedVariationCode?: string | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; accent: string }> = {
  Daily: { label: "Daily", icon: Calendar, color: "bg-sky-50 text-sky-600 border-sky-200", accent: "bg-sky-500" },
  Weekly: { label: "Weekly", icon: Calendar, color: "bg-emerald-50 text-emerald-600 border-emerald-200", accent: "bg-emerald-500" },
  Monthly: { label: "Monthly", icon: Calendar, color: "bg-violet-50 text-violet-600 border-violet-200", accent: "bg-violet-500" },
  Night: { label: "Night", icon: Moon, color: "bg-indigo-50 text-indigo-600 border-indigo-200", accent: "bg-indigo-500" },
  Weekend: { label: "Weekend", icon: Calendar, color: "bg-amber-50 text-amber-600 border-amber-200", accent: "bg-amber-500" },
  Social: { label: "Social", icon: Users, color: "bg-rose-50 text-rose-600 border-rose-200", accent: "bg-rose-500" },
  SME: { label: "SME", icon: Users, color: "bg-teal-50 text-teal-600 border-teal-200", accent: "bg-teal-500" },
  Hynetflex: { label: "Hynetflex", icon: Router, color: "bg-cyan-50 text-cyan-600 border-cyan-200", accent: "bg-cyan-500" },
  "Broadband router": { label: "Broadband", icon: Router, color: "bg-slate-50 text-slate-600 border-slate-200", accent: "bg-slate-500" },
  Others: { label: "Other", icon: Wifi, color: "bg-slate-50 text-slate-600 border-slate-200", accent: "bg-slate-500" },
};

const ROW_ACCENTS = [
  "border-l-sky-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-teal-500",
];

const FAVORITES_STORAGE_KEY = "data-plan-favorites";

export function DataPlanSelector({
  variationCodes,
  isLoading,
  error,
  onSelectPlan,
  selectedVariationCode,
}: DataPlanSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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
        <p className="text-xs sm:text-sm text-dashboard-muted">Loading data plans…</p>
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

  if (!variationCodes || !variationCodes.variations_categorized) {
    return (
      <div className="text-center py-10">
        <p className="text-xs sm:text-sm text-dashboard-muted">No data plans available.</p>
      </div>
    );
  }

  // Exclude non-category keys like "total" and "_all_with_id"
  const skipKeys = new Set(["total", "_all_with_id"]);
  const rawCategories = Object.keys(variationCodes.variations_categorized).filter(
    (cat) => !skipKeys.has(cat) && variationCodes.variations_categorized[cat]?.count > 0
  );

  // Order: "All" first, named categories in the middle, "Others" last
  const allKey = rawCategories.find((c) => c === "All");
  const othersKey = rawCategories.find((c) => c === "Others");
  const middleCategories = rawCategories.filter((c) => c !== "All" && c !== "Others");
  const categories = [
    ...(allKey ? [allKey] : []),
    ...middleCategories,
    ...(othersKey ? [othersKey] : []),
  ];

  if (!activeCategory && categories.length > 0) {
    setActiveCategory(categories[0]);
  }

  const activeVariations =
    variationCodes.variations_categorized[activeCategory || ""]?.variations || [];

  const displayedVariations = showFavoritesOnly
    ? activeVariations.filter((v) => isFavorite(v.variation_code))
    : activeVariations;

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

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-dashboard-border/80 overflow-x-auto scrollbar-none -mx-1 px-1">
          {categories.map((category) => {
            const isAll = category === "All";
            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Others;
            const Icon = isAll ? Wifi : config.icon;
            const label = isAll ? "All" : config.label;
            const count = variationCodes.variations_categorized[category]?.count || 0;
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap touch-manipulation",
                  "border",
                  isActive
                    ? isAll
                      ? "bg-brand-bg-primary/10 text-brand-bg-primary border-brand-bg-primary/30 font-semibold"
                      : `${config.color} font-semibold`
                    : "bg-dashboard-surface text-dashboard-muted border-dashboard-border/60 hover:bg-dashboard-bg hover:text-dashboard-heading"
                )}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {label}
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Plans – single row per plan */}
      {displayedVariations.length > 0 ? (
        <div className="space-y-1.5 sm:space-y-2">
          {displayedVariations.map((variation, index) => {
            const isSelected = selectedVariationCode === variation.variation_code;
            const amount = parseFloat(variation.variation_amount);
            const accentClass = ROW_ACCENTS[index % ROW_ACCENTS.length];

            return (
              <button
                key={`${variation.variation_code}-${index}`}
                onClick={() => onSelectPlan(variation)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl border-l-[3px] border border-l-[3px] transition-all text-left touch-manipulation",
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

                {/* Favourite star */}
                <button
                  onClick={(e) => toggleFavorite(variation.variation_code, e)}
                  className="p-1.5 -mr-1 rounded-lg hover:bg-dashboard-border/40 transition-colors touch-manipulation shrink-0"
                  title={isFavorite(variation.variation_code) ? "Remove from favourites" : "Add to favourites"}
                >
                  <Star className={cn("h-4 w-4 transition-colors", isFavorite(variation.variation_code) ? "fill-yellow-400 text-yellow-400" : "text-dashboard-muted/50 hover:text-yellow-400")} />
                </button>

                {/* Chevron */}
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
          <p className="text-xs sm:text-sm">No plans available in this category.</p>
        </div>
      )}
    </div>
  );
}
