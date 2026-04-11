"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FundWalletModal } from "@/components/dashboard/FundWalletModal";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Phone,
  Wifi,
  Tv,
  Receipt,
  Landmark,
  Hash,
  Send,
  GraduationCap,
  Dices,
  CreditCard,
  Globe,
} from "lucide-react";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingWalkthrough } from "@/components/dashboard/OnboardingWalkthrough";
import {
  getPaymentReference,
  clearPaymentReference,
  clearPaymentInProgress,
  isPaymentInProgress,
} from "@/lib/auth-storage";
import {
  getWelcomeBonusCongratsShownTxId,
  setWelcomeBonusCongratsShownTxId,
} from "@/lib/welcome-bonus-storage";
// import { WalletAnalysisCards } from "@/components/dashboard/WalletAnalysisCards";
import type { Transaction as DashboardTransaction } from "@/types/dashboard";
import {
  WelcomeBonusCongrats,
  FIRST_TX_BONUS_TYPE,
} from "@/components/dashboard/WelcomeBonusCongrats";
import { RewardBanners } from "@/components/dashboard/RewardBanners";
import { getNetworkLogo } from "@/lib/network-logos";
import { motion, AnimatePresence } from "motion/react";

const TRANSFER_ACTIONS = [
  { id: "to-smipay", name: "To Smipay", icon: Send, href: "/dashboard/transfer/smipay", comingSoon: true, bg: "var(--quick-action-1-bg)", color: "var(--quick-action-1)" },
  { id: "to-bank", name: "To Bank", icon: Landmark, href: "/dashboard/transfer/bank", comingSoon: true, bg: "var(--quick-action-4-bg)", color: "var(--quick-action-4)" },
  { id: "to-tag", name: "To Tag", icon: Hash, href: "/dashboard/transfer/tag", comingSoon: true, bg: "var(--quick-action-2-bg)", color: "var(--quick-action-2)" },
];

const SERVICE_ACTIONS = [
  { id: "airtime", name: "Airtime", icon: Phone, href: "/dashboard/airtime", comingSoon: false, bg: "var(--quick-action-3-bg)", color: "var(--quick-action-3)" },
  { id: "data", name: "Data", icon: Wifi, href: "/dashboard/data", comingSoon: false, bg: "var(--quick-action-2-bg)", color: "var(--quick-action-2)" },
  { id: "cable", name: "Cable TV", icon: Tv, href: "/dashboard/cabletv", comingSoon: false, bg: "var(--quick-action-5-bg)", color: "var(--quick-action-5)" },
  { id: "education", name: "Education", icon: GraduationCap, href: "/dashboard/education/vtpass", comingSoon: false, bg: "var(--quick-action-1-bg)", color: "var(--quick-action-1)" },
  { id: "electricity", name: "Electricity", icon: Zap, href: "/dashboard/electricity/vtpass", comingSoon: false, bg: "var(--quick-action-4-bg)", color: "var(--quick-action-4)" },
  { id: "intl-airtime", name: "Intl. Airtime", icon: Globe, href: "/dashboard/intl-airtime/vtpass", comingSoon: false, bg: "var(--quick-action-2-bg)", color: "var(--quick-action-2)" },
  { id: "cards", name: "Cards", icon: CreditCard, href: "/dashboard/cards", comingSoon: true, bg: "var(--quick-action-4-bg)", color: "var(--quick-action-4)" },
  { id: "betting", name: "Betting", icon: Dices, href: "/dashboard/betting", comingSoon: true, bg: "var(--quick-action-6-bg)", color: "var(--quick-action-6)" },
];

const container = {
  hidden: { opacity: 0 },
  visible: () => ({
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  }),
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

const PROMO_LABELS: Record<string, string> = {
  airtime: "Up to 9% off",
  data: "Up to 7% off",
};

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header skeleton matching new header layout */}
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          {/* Mobile menu avatar */}
          <div className="lg:hidden shrink-0">
            <div className="h-9 w-9 rounded-lg bg-dashboard-border/60 animate-pulse" />
          </div>
          {/* Desktop avatar */}
          <div className="hidden lg:block shrink-0">
            <div className="h-9 w-9 rounded-lg bg-dashboard-border/60 animate-pulse" />
          </div>
          {/* Greeting text */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-4 w-24 sm:w-28 bg-dashboard-border/70 rounded animate-pulse" />
            <div className="h-3 w-32 sm:w-40 bg-dashboard-border/50 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Top row: wallet card + user info card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Wallet card skeleton */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl h-40 sm:h-44 animate-pulse"
              style={{
                background:
                  "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)",
              }}
            />
          </div>

          {/* User info card skeleton (desktop only) */}
          <div className="hidden lg:block">
            <div className="bg-dashboard-surface rounded-2xl border border-dashboard-border/80 shadow-sm p-5 h-full animate-pulse">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 rounded-full bg-dashboard-border/50" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-dashboard-border/50 rounded" />
                  <div className="h-2.5 w-24 bg-dashboard-border/40 rounded" />
                </div>
              </div>
              <div className="border-t border-dashboard-border/80 pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-12 bg-dashboard-border/40 rounded" />
                  <div className="h-4 w-16 bg-dashboard-border/40 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-10 bg-dashboard-border/40 rounded" />
                  <div className="h-4 w-18 bg-dashboard-border/40 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-9 bg-dashboard-border/40 rounded" />
                  <div className="h-4 w-14 bg-dashboard-border/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reward banners skeleton */}
        <div className="flex gap-3 overflow-hidden">
          <div className="flex-none w-[85%] sm:w-[320px] h-[62px] rounded-xl bg-dashboard-border/40 animate-pulse" />
          <div className="flex-none w-[85%] sm:w-[320px] h-[62px] rounded-xl bg-dashboard-border/30 animate-pulse" />
        </div>

        {/* Service actions skeleton */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-2 pt-5 pb-3 sm:px-4 sm:pt-5 sm:pb-4 lg:px-6 lg:pt-6 lg:pb-6 animate-pulse">
          <div className="grid grid-cols-4 gap-y-5 sm:gap-y-6 lg:grid-cols-8 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-dashboard-border/50" />
                <div className="h-2.5 w-12 mt-2 rounded bg-dashboard-border/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Transfer actions skeleton */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-3 pt-5 pb-3 sm:p-4 sm:pt-5 animate-pulse">
          <div className="grid grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-dashboard-border/50" />
                <div className="h-2.5 w-14 mt-2 rounded bg-dashboard-border/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions skeleton */}
        <section>
          <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 ${
                  i > 0 ? "border-t border-dashboard-border/40" : ""
                }`}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-dashboard-border/50 animate-pulse shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3 w-28 sm:w-36 bg-dashboard-border/50 rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-dashboard-border/40 rounded animate-pulse" />
                </div>
                <div className="text-right space-y-1.5">
                  <div className="h-3 w-12 bg-dashboard-border/50 rounded animate-pulse ml-auto" />
                  <div className="h-2.5 w-10 bg-dashboard-border/40 rounded animate-pulse ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { dashboardData, isLoading: loading, error, refetch } = useDashboard();
  const [isFundWalletModalOpen, setIsFundWalletModalOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [showWelcomeBonusCongrats, setShowWelcomeBonusCongrats] = useState(false);
  const [welcomeBonusTx, setWelcomeBonusTx] = useState<{ id: string; amount: number } | null>(null);

  const walletCardRef = useRef<HTMLDivElement>(null);
  const quickLinksRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);
  const rewardBannersRef = useRef<HTMLDivElement>(null);
  const showOnboarding = user?.has_completed_onboarding === false;

  // Show welcome-bonus congrats once per first_tx_bonus tx (scan recent txs so referral/other bonuses don't hide it)
  useEffect(() => {
    if (!dashboardData?.transaction_history?.length) return;
    const recent = dashboardData.transaction_history.slice(0, 20);
    const firstTxBonus = recent.find((tx) => tx.type === FIRST_TX_BONUS_TYPE);
    if (!firstTxBonus) return;
    if (getWelcomeBonusCongratsShownTxId() === firstTxBonus.id) return;
    setWelcomeBonusTx({ id: firstTxBonus.id, amount: Number(firstTxBonus.amount) });
    setShowWelcomeBonusCongrats(true);
  }, [dashboardData?.transaction_history]);

  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("payment") === "callback") {
          window.location.reload();
          return;
        }
        if (isPaymentInProgress()) {
          const ref = getPaymentReference();
          if (ref) {
            window.location.href = `${window.location.origin}/dashboard?payment=callback`;
          } else {
            clearPaymentInProgress();
            clearPaymentReference();
            window.location.reload();
          }
        }
      }
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const urlReference = searchParams.get("reference") || searchParams.get("trxref");

    if (payment === "callback") {
      const reference = urlReference || getPaymentReference();

      if (reference) {
        queueMicrotask(() => {
          setPaymentReference(reference);
          setIsFundWalletModalOpen(true);
        });
      } else {
        clearPaymentInProgress();
        clearPaymentReference();
      }

      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        url.searchParams.delete("reference");
        url.searchParams.delete("trxref");
        router.replace(url.pathname, { scroll: false });
      }, 500);
    }
  }, [searchParams, router]);

  // Safety net: if user navigated back from Paystack without bfcache (fresh load)
  // and a payment was still in progress, open the verification modal.
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment && isPaymentInProgress()) {
      const ref = getPaymentReference();
      if (ref) {
        queueMicrotask(() => {
          setPaymentReference(ref);
          setIsFundWalletModalOpen(true);
        });
      } else {
        clearPaymentInProgress();
        clearPaymentReference();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseBalance = (balance: string): number => {
    return parseFloat(balance.replace(/,/g, ""));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionLogo = (transaction: DashboardTransaction): string | null => {
    if (transaction.provider) {
      const logo = getNetworkLogo(transaction.provider);
      if (logo) return logo;
    }
    if (transaction.icon) return transaction.icon;
    return null;
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm">{error || "Failed to load dashboard"}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const primaryAccount = dashboardData.accounts[0];
  const isCashbackActive = dashboardData.cashback_rates?.some((r) => r.is_active) ?? false;
  const cashbackWallet = dashboardData.cashback_wallet;

  const profilePhotoUrl = dashboardData.user.profile_image?.trim() ?? "";
  const hasProfilePhoto = profilePhotoUrl.length > 0;
  const initialA = (dashboardData.user.first_name?.[0] || dashboardData.user.name?.[0] || "?").toUpperCase();
  const initialB = (dashboardData.user.last_name?.[0] || "").toUpperCase();

  const renderHeaderAvatar = () =>
    hasProfilePhoto ? (
      // eslint-disable-next-line @next/next/no-img-element -- user-uploaded URL (Cloudinary, etc.)
      <img
        src={profilePhotoUrl}
        alt=""
        className="h-9 w-9 rounded-full object-cover ring-1 ring-dashboard-border/50 bg-dashboard-bg shrink-0"
      />
    ) : (
      <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-semibold shrink-0 ring-1 ring-dashboard-border/40">
        {initialB ? `${initialA}${initialB}` : initialA}
      </div>
    );

  return (
    <div className="min-h-screen bg-dashboard-bg min-w-0 w-full">
      {/* Fixed: header + wallet card. On desktop (lg), starts at sidebar edge (left-72) */}
      <div className="fixed top-0 left-0 right-0 lg:left-72 z-20 bg-dashboard-bg pb-4 sm:pb-6">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-dashboard-surface border-b border-dashboard-border/60"
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5 lg:pl-5 lg:pr-6">
            <div ref={menuButtonRef} className="shrink-0">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-mobile-sidebar"))}
                className="lg:hidden active:scale-95 transition-transform touch-manipulation rounded-full overflow-hidden"
                aria-label="Open menu"
              >
                {renderHeaderAvatar()}
              </button>
              <div className="hidden lg:block" aria-hidden>
                {renderHeaderAvatar()}
              </div>
            </div>
            <p className="text-base sm:text-lg font-semibold text-dashboard-heading tracking-tight truncate">
              Hi, {dashboardData.user.first_name}
            </p>
          </div>
        </motion.header>

        <div className="px-4 pt-5 sm:px-6 sm:pt-6 lg:pl-5 lg:pr-6 w-full min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-5">
            {/* Virtual Account Card - shown first on mobile */}
            <div ref={walletCardRef} className="lg:col-span-2 order-1">
              <WalletCard
              bankName={primaryAccount?.bank_name}
              accountNumber={primaryAccount?.account_number}
              accountHolderName={primaryAccount?.account_holder_name}
              balance={parseBalance(dashboardData.wallet_card.current_balance)}
              cashbackBalance={isCashbackActive ? cashbackWallet?.current_balance : undefined}
              isActive={primaryAccount?.isActive ?? true}
              // onFundWallet={() => setIsFundWalletModalOpen(true)} // temporarily hidden while funding is suspended
              onViewHistory={() => router.push("/dashboard/transactions")}
            />
          </div>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="hidden lg:block order-2"
          >
            <div className="bg-dashboard-surface rounded-2xl border border-dashboard-border/80 shadow-sm p-5 h-full">
              <div className="flex items-center gap-3 mb-5">
                {dashboardData.user.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- dynamic user avatar URL
                  <img
                    src={dashboardData.user.profile_image}
                    alt={dashboardData.user.name}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-dashboard-border"
                  />
                ) : (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-semibold">
                    {dashboardData.user.first_name[0]}
                    {dashboardData.user.last_name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-dashboard-heading text-sm truncate">
                    {dashboardData.user.first_name} {dashboardData.user.last_name}
                  </p>
                  <p className="text-xs text-dashboard-muted truncate">@{dashboardData.user.smipay_tag}</p>
                </div>
              </div>
              <div className="space-y-0 border-t border-dashboard-border/80 pt-4">
                <div className="flex items-center justify-between py-2.5 border-b border-dashboard-border/60">
                  <span className="text-xs text-dashboard-muted">Email</span>
                  <span
                    className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                      dashboardData.user.is_email_verified
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {dashboardData.user.is_email_verified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-dashboard-border/60">
                  <span className="text-xs text-dashboard-muted">KYC</span>
                  <span
                    className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                      dashboardData.kyc_verification.is_verified
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {dashboardData.kyc_verification.status}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-dashboard-muted">Tier</span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700">
                    {dashboardData.current_tier.tier}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </div>

      {/* Spacer: reserves space so content doesn't hide under fixed block */}
      <div className="h-[260px] sm:h-[280px] lg:h-[340px]" aria-hidden />

      {/* Scrollable content — full width of main area, tight to sidebar */}
      <div className="px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6 lg:pl-5 lg:pr-6 w-full min-w-0 space-y-6 sm:space-y-8">
        {/* Reward Banners — first in scrollable content, under wallet card */}
        {dashboardData.reward_banners && dashboardData.reward_banners.length > 0 && (
          <div
            ref={rewardBannersRef}
            className="min-w-0 overflow-visible lg:pt-3"
          >
            <RewardBanners
              banners={dashboardData.reward_banners}
              userTag={dashboardData.user.smipay_tag}
            />
          </div>
        )}

        {/* Service Actions – quick links */}
        <section
          ref={quickLinksRef}
          className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-2 pt-5 pb-3 sm:px-4 sm:pt-5 sm:pb-4 lg:px-6 lg:pt-6 lg:pb-6"
        >
          <div className="grid grid-cols-4 gap-y-5 sm:gap-y-6 lg:grid-cols-8 lg:gap-6">
            {SERVICE_ACTIONS.map((action) => {
              const promoLabel = PROMO_LABELS[action.id];
              return (
                <div key={action.id} className="flex flex-col items-center">
                  {action.comingSoon ? (
                    <div className="relative">
                      <div
                        className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full opacity-75 cursor-not-allowed"
                        style={{ backgroundColor: action.bg, color: action.color }}
                      >
                        <action.icon className="h-[17px] w-[17px] sm:h-[19px] sm:w-[19px] lg:h-[22px] lg:w-[22px]" strokeWidth={1.8} />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 px-1 py-px rounded-full bg-amber-500 text-white text-[7px] sm:text-[8px] font-bold uppercase leading-none tracking-wide">
                        Soon
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      {promoLabel && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-0 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold leading-none whitespace-nowrap shadow-sm">
                          {promoLabel}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push(action.href)}
                        className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full transition-shadow hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent touch-manipulation"
                        style={{ backgroundColor: action.bg, color: action.color }}
                      >
                        <action.icon className="h-[17px] w-[17px] sm:h-[19px] sm:w-[19px] lg:h-[22px] lg:w-[22px]" strokeWidth={1.8} />
                      </button>
                    </div>
                  )}
                  <span className="mt-1.5 text-xs sm:text-sm font-medium text-dashboard-heading leading-tight text-center">
                    {action.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transfer Actions – 3 across, circular icons, no header */}
        <section
          className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-3 pt-5 pb-3 sm:p-4 sm:pt-5 lg:p-6 lg:pt-6"
        >
          <div className="grid grid-cols-3 lg:gap-4">
            {TRANSFER_ACTIONS.map((action) => (
              <div key={action.id} className="flex flex-col items-center">
                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="flex h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full opacity-75 cursor-not-allowed transition-transform"
                    style={{ backgroundColor: action.bg, color: action.color }}
                  >
                    <action.icon className="h-[18px] w-[18px] sm:h-5 sm:w-5 lg:h-6 lg:w-6" strokeWidth={1.8} />
                  </button>
                  <span className="absolute -top-1.5 -right-1.5 px-1 py-px rounded-full bg-amber-500 text-white text-[7px] sm:text-[8px] font-bold uppercase leading-none tracking-wide">
                    Soon
                  </span>
                </div>
                <span className="mt-1.5 text-xs sm:text-sm font-medium text-dashboard-heading leading-tight text-center">
                  {action.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
            {dashboardData.transaction_history.length > 0 ? (
              <AnimatePresence mode="popLayout" initial={false}>
                {dashboardData.transaction_history.slice(0, 5).map((transaction, idx) => {
                  const logo = getTransactionLogo(transaction);
                  const isCredit = transaction.credit_debit === "credit";
                  const statusStyle =
                    transaction.status === "success"
                      ? "text-[var(--tx-success-text)]"
                      : transaction.status === "pending"
                        ? "text-[var(--tx-pending-text)]"
                        : "text-[var(--tx-failed-text)]";
                  return (
                    <motion.button
                      key={transaction.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 text-left hover:bg-dashboard-bg/50 active:bg-dashboard-bg/70 transition-colors focus:outline-none focus-visible:bg-dashboard-bg/50 touch-manipulation ${
                        idx > 0 ? "border-t border-dashboard-border/40" : ""
                      }`}
                      onClick={() =>
                        router.push(
                          `/dashboard/transactions/${transaction.id}${transaction.provider ? `?provider=${transaction.provider}` : ""}`
                        )
                      }
                    >
                      <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-dashboard-bg/80">
                        {isCredit ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />
                        ) : logo ? (
                          // eslint-disable-next-line @next/next/no-img-element -- dynamic network/transaction logo
                          <img
                            src={logo}
                            alt=""
                            className="h-full w-full object-contain p-[5px]"
                          />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--tx-failed-text)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-dashboard-heading text-xs sm:text-[13px] truncate leading-tight">
                          {transaction.description}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-dashboard-muted mt-0.5 leading-tight">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <p
                          className={`text-xs sm:text-[13px] font-semibold tabular-nums leading-tight ${
                            isCredit ? "text-[var(--tx-success-text)]" : "text-dashboard-heading"
                          }`}
                        >
                          {isCredit ? "+" : "−"}₦{Number(transaction.amount).toLocaleString()}
                        </p>
                        <span
                          className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${statusStyle}`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dashboard-bg text-dashboard-muted">
                  <Receipt className="h-4.5 w-4.5" />
                </div>
                <p className="mt-2.5 text-xs font-medium text-dashboard-heading">No transactions yet</p>
                <p className="mt-0.5 text-[11px] text-dashboard-muted">Your recent activity will appear here</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* FundWalletModal — temporarily hidden while funding is suspended */}
      {/* <FundWalletModal
        isOpen={isFundWalletModalOpen}
        onClose={() => {
          setIsFundWalletModalOpen(false);
          setPaymentReference(null);
          refetch();
        }}
        bankAccounts={dashboardData?.accounts || []}
        initialReference={paymentReference}
      /> */}

      {welcomeBonusTx && (
        <WelcomeBonusCongrats
          isOpen={showWelcomeBonusCongrats}
          onClose={() => {
            setWelcomeBonusCongratsShownTxId(welcomeBonusTx.id);
            setShowWelcomeBonusCongrats(false);
          }}
          amount={welcomeBonusTx.amount}
          transactionId={welcomeBonusTx.id}
        />
      )}

      {showOnboarding && dashboardData && (
        <OnboardingWalkthrough
          firstName={dashboardData.user.first_name}
          walletCardRef={walletCardRef}
          quickLinksRef={quickLinksRef}
          menuButtonRef={menuButtonRef}
          rewardBannersRef={rewardBannersRef}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardSkeleton />
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
