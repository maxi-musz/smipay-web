"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lightbulb,
  ChevronDown,
  Power,
  Layers,
  Sprout,
  ShoppingCart,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

interface AccordionProps {
  icon: typeof Lightbulb;
  iconBg: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Accordion({
  icon: Icon,
  iconBg,
  title,
  children,
  defaultOpen = false,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-dashboard-border/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-dashboard-surface hover:bg-dashboard-bg/50 transition-colors"
      >
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-dashboard-heading text-left flex-1">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-dashboard-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-dashboard-bg/30 border-t border-dashboard-border/40 space-y-3 text-xs text-dashboard-heading leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold text-[11px]">
      {children}
    </span>
  );
}

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        className="bg-dashboard-surface rounded-2xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-2xl my-4 sm:my-8 overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-dashboard-surface border-b border-dashboard-border/60 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-dashboard-heading">
                How Service Markup Works
              </h2>
              <p className="text-[11px] text-dashboard-muted">
                Plain-English guide for admins
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-lg hover:bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="bg-brand-bg-primary/5 border border-brand-bg-primary/20 rounded-xl px-4 py-3">
            <p className="text-xs text-dashboard-heading leading-relaxed">
              <strong>In a nutshell:</strong> Markup is the{" "}
              <Highlight>margin</Highlight> we add on top of provider (e.g.
              VTpass) prices. It is <strong>not a reward</strong> — it is our{" "}
              <strong>revenue</strong> on each transaction. The user pays
              (provider price + markup); we keep the markup.
            </p>
            <div className="mt-2.5 bg-white/60 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-dashboard-muted leading-relaxed">
                <strong className="text-dashboard-heading">Example:</strong>{" "}
                VTpass sells a data plan for ₦1,000. If markup for data is 7.5%,
                we show the user ₦1,075 and charge that. We pay VTpass ₦1,000
                and keep <Highlight>₦75</Highlight> as markup revenue.
              </p>
            </div>
          </div>

          <Accordion
            icon={Power}
            iconBg="bg-emerald-100 text-emerald-600"
            title="Part 1 — Global Config"
            defaultOpen
          >
            <p className="text-dashboard-muted mb-2">
              Master settings for the whole markup program:
            </p>
            <ul className="space-y-1.5 text-dashboard-muted">
              <li>
                <strong className="text-dashboard-heading">Markup Active:</strong>{" "}
                ON = users pay provider + markup; OFF = users pay provider price
                only.
              </li>
              <li>
                <strong className="text-dashboard-heading">Default %:</strong>{" "}
                Fallback when a service has no rule or rule is inactive.
              </li>
              <li>
                <strong className="text-dashboard-heading">Default % (Friendlies):</strong>{" "}
                Optional lower % for partner/test accounts. Empty = same as
                default.
              </li>
              <li>
                <strong className="text-dashboard-heading">Min Amount to Apply Markup:</strong>{" "}
                Transactions below this (NGN) get no markup. 0 = no minimum.
              </li>
            </ul>
          </Accordion>

          <Accordion
            icon={Layers}
            iconBg="bg-purple-100 text-purple-600"
            title="Part 2 — Per-Service Rules"
          >
            <p className="text-dashboard-muted mb-2">
              Different markup % per service: airtime, data, cable, electricity,
              education, betting, international_airtime. Each rule can override %
              and optional % for friendlies and min amount. When a rule is OFF,
              that service gets 0% markup (we respect OFF over default %).
            </p>
          </Accordion>

          <Accordion
            icon={Sprout}
            iconBg="bg-green-100 text-green-600"
            title='What Does "Seed All Rules" Mean?'
          >
            <p className="text-dashboard-muted">
              When you first open the page, there may be <strong>no rules</strong>.
              <Highlight>Seed All Rules</Highlight> creates a row for every
              service type. All start at <strong>0% and OFF</strong>. After
              seeding, set the percentages you want and turn each service ON. You
              only need to click it once.
            </p>
          </Accordion>

          <Accordion
            icon={ShoppingCart}
            iconBg="bg-orange-100 text-orange-600"
            title="What Happens When a User Buys Something"
          >
            <p className="text-dashboard-muted mb-2">
              Example: user buys a data plan. VTpass price = ₦1,000, data rule
              = 7.5%, min amount = ₦300.
            </p>
            <div className="space-y-1.5">
              {[
                ["1", "Is markup program ON?", "Yes ✓"],
                ["2", "Does data have a rule and is it active?", "Yes, 7.5% ✓"],
                ["3", "Is ₦1,000 ≥ min amount (₦300)?", "Yes ✓"],
                ["4", "Markup = ₦1,000 × 7.5% = ₦75. User charged ₦1,075.", "We keep ₦75 ✓"],
              ].map(([step, action, result]) => (
                <div key={step} className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-brand-bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                    <span className="text-dashboard-heading">{action}</span>
                    <span className="text-emerald-600 font-medium">{result}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-dashboard-muted mt-2 italic">
              If the user buys a ₦200 plan (below ₦300), they are charged ₦200 —
              no markup.
            </p>
          </Accordion>

          <Accordion
            icon={HelpCircle}
            iconBg="bg-slate-100 text-slate-600"
            title="Common Questions"
          >
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-dashboard-heading">
                  If I turn off markup, do existing transactions change?
                </p>
                <p className="text-dashboard-muted mt-0.5">
                  No. Turning it off only affects <em>new</em> transactions.
                </p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">
                  If I change the percentage, does it affect past transactions?
                </p>
                <p className="text-dashboard-muted mt-0.5">
                  No. Changes apply only to <em>future</em> purchases.
                </p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">
                  Where do I see revenue from markup?
                </p>
                <p className="text-dashboard-muted mt-0.5">
                  In the admin <strong>Dashboard</strong> (revenue breakdown) and
                  in <strong>Transactions</strong> (per-transaction markup_value
                  and revenue totals).
                </p>
              </div>
            </div>
          </Accordion>
        </div>

        <div className="sticky bottom-0 bg-dashboard-surface border-t border-dashboard-border/60 px-4 sm:px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 transition-all"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
