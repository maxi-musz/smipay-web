"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, Sparkles, Wallet, Zap, Headphones, PanelLeft, Gift } from "lucide-react";
import { authApi } from "@/services/auth-api";
import { useAuthStore } from "@/store/auth-store-backend";

interface OnboardingWalkthroughProps {
  firstName: string;
  walletCardRef: React.RefObject<HTMLDivElement | null>;
  quickLinksRef: React.RefObject<HTMLDivElement | null>;
  menuButtonRef?: React.RefObject<HTMLDivElement | null>;
  rewardBannersRef?: React.RefObject<HTMLDivElement | null>;
}

interface TooltipPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

const STEPS = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to Smipay!",
    description: "Let us give you a quick tour of your dashboard. It only takes a moment.",
  },
  {
    id: "menu",
    icon: PanelLeft,
    title: "Menu",
    description: "Tap the Smipay logo anytime to open the sidebar. You can access your profile, settings, and more from there.",
  },
  {
    id: "wallet",
    icon: Wallet,
    title: "Your Wallet",
    description: "This is your account balance. Tap **+ Add Money** to fund your wallet instantly.",
  },
  {
    id: "rewards",
    icon: Gift,
    title: "Rewards & offers",
    description: "Here you’ll see promos like **Welcome Bonus** and cashback. Tap a banner to see how to earn.",
  },
  {
    id: "quicklinks",
    icon: Zap,
    title: "Quick Services",
    description: "Buy airtime, data, and more right from here. Fast and easy.",
  },
  {
    id: "support",
    icon: Headphones,
    title: "Need Help?",
    description: "Tap this button anytime to reach our support team.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function renderMarkdownBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

function OnboardingCard({
  stepIcon: StepIcon,
  title,
  description,
  currentStep,
  totalSteps,
  isLast,
  isWelcome,
  onNext,
  onSkip,
}: {
  stepIcon: React.ElementType;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  isLast: boolean;
  isWelcome: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className={`relative rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl ${isWelcome ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}>
      <button
        type="button"
        onClick={onSkip}
        className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Skip onboarding"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-bg-primary/20 mb-2.5">
        <StepIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-brand-bg-primary" />
      </div>

      <h3 className="text-[15px] sm:text-base font-semibold text-white leading-tight pr-6">
        {title}
      </h3>

      <p className="text-[13px] sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        {renderMarkdownBold(description)}
      </p>

      <div className="flex items-center justify-between mt-4 sm:mt-5">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-5 bg-brand-bg-primary"
                  : i < currentStep
                    ? "w-1.5 bg-brand-bg-primary/50"
                    : "w-1.5 bg-slate-600"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-[13px] sm:text-sm font-medium transition-colors"
        >
          {isLast ? "Got it" : isWelcome ? "Start tour" : "Next"}
          {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function OnboardingWalkthrough({
  firstName,
  walletCardRef,
  quickLinksRef,
  menuButtonRef,
  rewardBannersRef,
}: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [targetRect, setTargetRect] = useState<TooltipPosition | null>(null);
  const completedRef = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const getElementForStep = useCallback(
    (step: number): HTMLElement | null => {
      const id = STEPS[step]?.id as StepId;
      if (id === "menu" && menuButtonRef?.current) return menuButtonRef.current;
      if (id === "wallet") return walletCardRef.current;
      if (id === "rewards" && rewardBannersRef?.current) return rewardBannersRef.current;
      if (id === "quicklinks") return quickLinksRef.current;
      if (id === "support") return document.querySelector<HTMLElement>("[data-onboarding='support-fab']");
      return null;
    },
    [walletCardRef, quickLinksRef, menuButtonRef, rewardBannersRef]
  );

  useEffect(() => {
    const el = getElementForStep(currentStep);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateRect();

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(updateRect, 400);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep, getElementForStep]);

  const completeOnboarding = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setVisible(false);

    try {
      await authApi.completeOnboarding();
    } catch {
      // Non-critical — worst case user sees onboarding again next login
    }

    if (user) {
      setUser({ ...user, has_completed_onboarding: true });
    }
  }, [user, setUser]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  if (!visible) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isWelcome = step.id === "welcome";
  const isLast = currentStep === STEPS.length - 1;
  const padding = 8;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999]"
        >
          {/* Backdrop */}
          <div className="absolute inset-0">
            {targetRect && !isWelcome ? (
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <mask id="onboarding-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={targetRect.left - padding}
                      y={targetRect.top - padding}
                      width={targetRect.width + padding * 2}
                      height={targetRect.height + padding * 2}
                      rx="16"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.6)"
                  mask="url(#onboarding-mask)"
                />
              </svg>
            ) : (
              <div className="absolute inset-0 bg-black/60" />
            )}
          </div>

          {/* Highlight ring */}
          {targetRect && !isWelcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="absolute rounded-2xl ring-2 ring-brand-bg-primary/80 ring-offset-2 ring-offset-transparent pointer-events-none"
              style={{
                top: targetRect.top - padding,
                left: targetRect.left - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
              }}
            />
          )}

          {/* Card container — flex-centered for welcome, absolutely positioned for tooltips */}
          {isWelcome || !targetRect ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center px-5">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-full max-w-[320px]"
              >
                <OnboardingCard
                  stepIcon={StepIcon}
                  title={isWelcome ? `Welcome, ${firstName}! 🎉` : step.title}
                  description={step.description}
                  currentStep={currentStep}
                  totalSteps={STEPS.length}
                  isLast={isLast}
                  isWelcome={isWelcome}
                  onNext={handleNext}
                  onSkip={handleSkip}
                />
              </motion.div>
            </div>
          ) : (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="absolute z-10 px-4"
              style={(() => {
                const viewH = window.innerHeight;
                const viewW = window.innerWidth;
                const tooltipH = 200;
                const cardW = Math.min(320, viewW - 32);
                const belowTarget = targetRect.top + targetRect.height + padding + 12;
                const showAbove = belowTarget + tooltipH > viewH - 20;
                return {
                  top: showAbove
                    ? Math.max(12, targetRect.top - padding - tooltipH - 4)
                    : belowTarget,
                  left: Math.max(
                    16,
                    Math.min(
                      targetRect.left + targetRect.width / 2 - cardW / 2,
                      viewW - cardW - 16
                    )
                  ),
                  width: cardW,
                };
              })()}
            >
              <OnboardingCard
                stepIcon={StepIcon}
                title={step.title}
                description={step.description}
                currentStep={currentStep}
                totalSteps={STEPS.length}
                isLast={isLast}
                isWelcome={false}
                onNext={handleNext}
                onSkip={handleSkip}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
