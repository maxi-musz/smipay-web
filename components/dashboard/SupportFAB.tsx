"use client";

import { useRouter, usePathname } from "next/navigation";
import { Headphones } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SupportFAB() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide when already on support pages
  if (pathname.startsWith("/dashboard/support")) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        type="button"
        onClick={() => router.push("/dashboard/support")}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 group"
        aria-label="Help & Support"
        data-onboarding="support-fab"
      >
        <div className="relative flex items-center">
          {/* Label - desktop only */}
          <span className="hidden sm:group-hover:inline-flex absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-dashboard-surface border border-dashboard-border shadow-lg text-xs font-medium text-dashboard-heading whitespace-nowrap">
            Help & Support
          </span>
          {/* Button */}
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-brand-bg-primary text-white shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95">
            <Headphones className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </div>
        </div>
      </motion.button>
    </AnimatePresence>
  );
}
