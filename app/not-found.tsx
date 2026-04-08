"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Home, LayoutDashboard, ArrowLeft, Compass } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-dashboard-bg flex flex-col items-center justify-center px-4 py-12 sm:px-6 relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
      >
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-brand-bg-primary/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-sky-400/10 to-transparent blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, var(--dashboard-border) 0.5px, transparent 0.5px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-dashboard-surface/95 backdrop-blur-md rounded-2xl border border-dashboard-border/80 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.12)] px-6 py-10 sm:px-10 sm:py-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-brand-bg-primary/10 blur-xl scale-150" />
              <Image
                src="/smipay-icon.jpg"
                alt="Smipay"
                width={64}
                height={64}
                className="relative rounded-2xl shadow-md ring-1 ring-dashboard-border/60"
                priority
              />
            </div>
          </div>

          <div className="relative mb-2">
            <p
              className="text-[clamp(5rem,22vw,7.5rem)] font-extrabold leading-none tracking-tighter text-dashboard-border select-none"
              aria-hidden
            >
              404
            </p>
            <p className="absolute inset-0 flex items-center justify-center text-[clamp(5rem,22vw,7.5rem)] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-300/90 to-slate-200/40 select-none pointer-events-none">
              404
            </p>
          </div>

          <div className="flex justify-center mb-5">
            <div className="h-1 w-14 rounded-full bg-brand-bg-primary" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-dashboard-bg border border-dashboard-border/60 px-3 py-1 text-[11px] font-medium text-dashboard-muted mb-4">
            <Compass className="h-3.5 w-3.5 text-brand-bg-primary shrink-0" />
            Lost in the app?
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-dashboard-heading tracking-tight mb-2">
            Page not found
          </h1>
          <p className="text-sm sm:text-[15px] text-dashboard-muted leading-relaxed mb-8 max-w-sm mx-auto">
            This link may be broken, the page was removed, or the address was mistyped. Head home or open your dashboard to get back on track.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-brand-bg-primary text-white text-sm font-semibold hover:bg-brand-bg-primary/92 transition-colors shadow-sm"
            >
              <Home className="h-4 w-4 shrink-0" />
              Go home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-dashboard-border/80 bg-dashboard-bg text-dashboard-heading text-sm font-semibold hover:bg-dashboard-border/20 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-brand-bg-primary" />
              Open dashboard
            </Link>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl text-sm font-medium text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Go back
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-dashboard-muted/80">
          Need help?{" "}
          <Link
            href="/dashboard/support"
            className="text-brand-bg-primary font-medium hover:underline underline-offset-2"
          >
            Visit support
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
