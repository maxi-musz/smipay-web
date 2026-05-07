"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Gift, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FIRST_TX_BONUS_TYPE = "first_tx_bonus";

export interface WelcomeBonusCongratsProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  transactionId: string;
}

function runConfetti() {
  if (typeof window === "undefined") return;
  import("canvas-confetti").then((confetti) => {
    const count = 120;
    const defaults = { origin: { y: 0.75 }, zIndex: 10000 };
    const fire = (particleRatio: number, opts: { spread: number; startVelocity?: number }) => {
      confetti.default({
        ...defaults,
        particleCount: Math.floor(count * particleRatio),
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, startVelocity: 45 });
    fire(0.2, { spread: 120 });
    fire(0.15, { spread: 140, startVelocity: 25 });
  });
}

export function WelcomeBonusCongrats({
  isOpen,
  onClose,
  amount,
  transactionId,
}: WelcomeBonusCongratsProps) {
  const hasFiredConfetti = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFiredConfetti.current) {
      hasFiredConfetti.current = true;
      runConfetti();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedAmount = `₦${Number(amount).toLocaleString()}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-bonus-title"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
        <motion.div
          key={transactionId}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[340px] rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl overflow-hidden"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 pt-8 pb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
              <Gift className="h-7 w-7 text-emerald-400" />
            </div>
            <h2
              id="welcome-bonus-title"
              className="text-lg font-semibold text-white mb-1"
            >
              Congratulations!
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              You&apos;ve successfully received your <strong className="text-white">Welcome Bonus</strong> of{" "}
              <span className="font-semibold text-emerald-400">{formattedAmount}</span>, which has been added to your wallet.
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 mb-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-emerald-200">
                {formattedAmount} credited to your balance
              </span>
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-semibold h-11"
            >
              Done
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export { FIRST_TX_BONUS_TYPE };
