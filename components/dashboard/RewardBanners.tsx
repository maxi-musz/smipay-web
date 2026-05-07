"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Gift, Coins, Sparkles, ChevronRight } from "lucide-react";
import type { RewardBanner } from "@/types/dashboard";

interface RewardBannersProps {
  banners: RewardBanner[];
  userTag?: string;
}

const BANNER_CONFIG: Record<
  RewardBanner["type"],
  {
    gradient: string;
    icon: typeof Gift;
    href: string;
    cta: string;
  }
> = {
  referral: {
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    icon: Gift,
    href: "/dashboard/airtime",
    cta: "Share & Earn",
  },
  cashback: {
    gradient: "from-emerald-600 via-green-600 to-teal-700",
    icon: Coins,
    href: "/dashboard/airtime",
    cta: "Start Earning",
  },
  first_transaction: {
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    icon: Sparkles,
    href: "/dashboard/airtime",
    cta: "Claim Bonus",
  },
};

export function RewardBanners({ banners, userTag }: RewardBannersProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth
      : el.offsetWidth;
    const idx = Math.round(scrollLeft / cardWidth);
    setActiveIdx(Math.min(idx, banners.length - 1));
  }, [banners.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  if (!banners.length) return null;

  const ORDER: RewardBanner["type"][] = ["first_transaction", "cashback", "referral"];
  const sorted = [...banners].sort(
    (a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type)
  );

  const handleTap = (banner: RewardBanner) => {
    if (banner.type === "referral" && userTag) {
      if (navigator.share) {
        navigator.share({
          title: "Join me on Smipay!",
          text: `Sign up on Smipay with my code "${userTag}" and we both earn rewards!`,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(userTag).catch(() => {});
      }
      return;
    }
    const config = BANNER_CONFIG[banner.type];
    router.push(config.href);
  };

  return (
    <div className="space-y-1.5">
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-3 overflow-x-auto overflow-y-visible scroll-smooth snap-x snap-mandatory scrollbar-hide lg:overflow-visible lg:grid lg:grid-cols-3 lg:gap-4"
      >
        {sorted.map((banner) => {
          const config = BANNER_CONFIG[banner.type];
          const Icon = config.icon;
          return (
            <button
              key={banner.type}
              type="button"
              onClick={() => handleTap(banner)}
              className={`
                flex-none shrink-0 snap-start
                w-[85%] sm:w-[min(320px,85%)]
                lg:w-full lg:min-w-0 lg:shrink-0 lg:min-h-[100px]
                ${banners.length === 1 ? "!w-full" : ""}
                rounded-xl overflow-hidden
                bg-gradient-to-r ${config.gradient}
                text-white text-left
                active:scale-[0.98] transition-transform
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                touch-manipulation
              `}
            >
              <div className="flex items-center gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-2.5 lg:gap-4 lg:px-5 lg:py-4 relative">
                <div className="absolute top-0 right-0 w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-white/[0.06] -translate-y-1/2 translate-x-1/3" />

                <div className="h-7 w-7 lg:h-10 lg:w-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                </div>
                <div className="flex-1 min-w-0 relative">
                  <p className="text-xs lg:text-base font-bold leading-tight truncate">
                    {banner.title}
                  </p>
                  <p className="text-[10px] lg:text-sm leading-snug text-white/80 mt-0.5 line-clamp-2">
                    {banner.message}
                  </p>
                  <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] lg:text-sm font-semibold text-white/90 uppercase tracking-wider">
                    {config.cta}
                    <ChevronRight className="h-2.5 w-2.5 lg:h-4 lg:w-4" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {sorted.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {sorted.map((b, i) => (
            <div
              key={b.type}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIdx
                  ? "w-4 bg-brand-bg-primary"
                  : "w-1.5 bg-dashboard-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
