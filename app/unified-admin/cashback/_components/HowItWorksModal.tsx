"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Lightbulb, ChevronDown, Power, Layers, Sprout, ShoppingCart, HelpCircle } from "lucide-react";
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

function Accordion({ icon: Icon, iconBg, title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-dashboard-border/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-dashboard-surface hover:bg-dashboard-bg/50 transition-colors"
      >
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-dashboard-heading text-left flex-1">
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 text-dashboard-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
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

function TableRow({ label, description, example }: { label: string; description: string; example?: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 py-2 border-b border-dashboard-border/30 last:border-0">
      <span className="font-semibold text-dashboard-heading sm:w-40 flex-shrink-0">{label}</span>
      <div className="flex-1">
        <p className="text-dashboard-muted">{description}</p>
        {example && (
          <p className="text-[10px] text-brand-bg-primary mt-0.5 italic">{example}</p>
        )}
      </div>
    </div>
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
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-dashboard-surface border-b border-dashboard-border/60 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-dashboard-heading">How Cashback Works</h2>
              <p className="text-[11px] text-dashboard-muted">A plain-English guide for admins</p>
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

        {/* Scrollable body */}
        <div className="px-4 sm:px-6 py-5 space-y-3 max-h-[75vh] overflow-y-auto">

          {/* Quick summary callout */}
          <div className="bg-brand-bg-primary/5 border border-brand-bg-primary/20 rounded-xl px-4 py-3">
            <p className="text-xs text-dashboard-heading leading-relaxed">
              <strong>In a nutshell:</strong> Cashback means we give users a small % of their money back whenever they buy something on our platform (airtime, data, electricity, etc.). It&apos;s a reward to keep them using us instead of OPay or PalmPay.
            </p>
            <div className="mt-2.5 bg-white/60 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-dashboard-muted leading-relaxed">
                <strong className="text-dashboard-heading">Example:</strong> A user buys ₦1,000 airtime. Airtime cashback is 3%. The user gets <Highlight>₦30 back</Highlight> into their cashback wallet — not their main wallet.
              </p>
            </div>
          </div>

          {/* Why separate wallet */}
          <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-blue-800 mb-1.5">Why a separate cashback wallet?</p>
            <ul className="space-y-1 text-[11px] text-blue-700 leading-relaxed">
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span> We can track exactly how much we&apos;re spending on cashback</li>
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span> Users see &ldquo;You&apos;ve earned ₦5,200 in cashback&rdquo; as a feel-good number</li>
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span> We can set rules around how/when they use the cashback balance</li>
            </ul>
          </div>

          {/* Accordions */}
          <Accordion
            icon={Power}
            iconBg="bg-emerald-100 text-emerald-600"
            title="Part 1 — Global Config (The Control Room)"
            defaultOpen
          >
            <p className="text-dashboard-muted mb-2">
              These are the master settings for the whole program. Think of them as the big switches and dials:
            </p>
            <div className="bg-dashboard-surface rounded-lg border border-dashboard-border/40 px-3 py-1">
              <TableRow
                label="Program ON/OFF"
                description="The master switch. OFF = nobody gets anything, no matter what."
                example="Something going wrong? Turn OFF immediately. Ready to launch? Turn ON."
              />
              <TableRow
                label="Default %"
                description="Fallback cashback percentage. Used when a service doesn't have its own rule."
                example="Set to 1% — any service without a specific rule gives 1%."
              />
              <TableRow
                label="Min Purchase"
                description="Minimum ₦ a user must spend to qualify. Prevents gaming with tiny transactions."
                example="Set to ₦100 — buying ₦80 airtime gives nothing, ₦100+ qualifies."
              />
              <TableRow
                label="Max Per Tx"
                description="Most cashback ₦ a user can earn from one single purchase."
                example="Set to ₦500 — even if calculated cashback is ₦25,000, user gets max ₦500."
              />
              <TableRow
                label="Max Per Day"
                description="Most cashback ₦ a user can earn in one day. Prevents abuse."
                example="Set to ₦2,000 — once a user earns ₦2,000 today, no more until tomorrow."
              />
            </div>
          </Accordion>

          <Accordion
            icon={Layers}
            iconBg="bg-purple-100 text-purple-600"
            title="Part 2 — Per-Service Rules"
          >
            <p className="text-dashboard-muted mb-2">
              Different services can have different cashback percentages — just like OPay does:
            </p>
            <div className="bg-dashboard-surface rounded-lg border border-dashboard-border/40 px-3 py-1">
              <TableRow label="Airtime (3%)" description="Most common transaction — higher cashback brings people back" />
              <TableRow label="Data (2.5%)" description="Also very common, slightly lower margin" />
              <TableRow label="Cable TV (2%)" description="Bigger ticket sizes, so even 2% is a decent reward" />
              <TableRow label="Electricity (1%)" description="Very large amounts (₦10K+), so we give less % to control costs" />
              <TableRow label="Education (0%)" description="Maybe we don't want to give cashback here yet" />
              <TableRow label="Betting (0%)" description="Don't want to incentivize gambling" />
            </div>
            <p className="text-dashboard-muted mt-2">
              Each rule also has optional overrides for <strong>Max Cashback Amount</strong> and <strong>Min Transaction Amount</strong>. Leave them empty to use the global values.
            </p>
          </Accordion>

          <Accordion
            icon={Sprout}
            iconBg="bg-green-100 text-green-600"
            title='What Does "Seed All Rules" Mean?'
          >
            <p className="text-dashboard-muted">
              When you first open cashback settings, there are <strong>no rules</strong> — the system doesn&apos;t know about airtime, data, etc.
            </p>
            <p className="text-dashboard-muted">
              <Highlight>Seed All Rules</Highlight> is a one-click setup that creates a row for every service type. All start at <strong>0% and OFF</strong>. After seeding, you just set the percentages and toggle each one on.
            </p>
            <p className="text-dashboard-muted font-medium">
              You only need to click this once. After that, the rules exist and you just edit them.
            </p>
          </Accordion>

          <Accordion
            icon={ShoppingCart}
            iconBg="bg-orange-100 text-orange-600"
            title="What Happens When a User Buys Something"
          >
            <p className="text-dashboard-muted mb-2">
              Let&apos;s say a user buys <strong>₦1,000 airtime</strong> and airtime cashback is 3%:
            </p>
            <div className="space-y-1.5">
              {[
                ["1", "Is the cashback program ON?", "Yes ✓"],
                ["2", "Does airtime have its own rule?", "Yes, 3% ✓"],
                ["3", "Calculate: ₦1,000 × 3%", "= ₦30 cashback"],
                ["4", "Is ₦30 within per-tx cap (₦500)?", "Yes ✓"],
                ["5", "Has user hit daily cap (₦2,000)?", "No ✓"],
                ["6", "Credit ₦30 to cashback wallet", "Done ✓"],
                ["7", "User sees notification:", '"You earned ₦30 cashback!"'],
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
              If the same user then buys ₦50 airtime (below the ₦100 minimum), they get nothing.
            </p>
          </Accordion>

          <Accordion
            icon={Sprout}
            iconBg="bg-blue-100 text-blue-600"
            title="First-Time Setup Guide"
          >
            <div className="space-y-2">
              {[
                "Open the Cashback page in admin (you're here!)",
                'Click "Seed All Rules" — creates a row for every service (all at 0% and OFF)',
                "Set the Global Config: turn program ON, set default %, min purchase (₦100), max per tx (₦500), max per day (₦2,000), then Save",
                "Go through each service rule: set airtime to 3% ON, data to 2.5% ON, cable to 2% ON, electricity to 1% ON — leave others OFF for now. Save each one.",
                "Done — users will start earning cashback on their next purchase!",
              ].map((text, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="h-5 w-5 rounded-full bg-dashboard-heading text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-dashboard-heading flex-1">{text}</p>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion
            icon={HelpCircle}
            iconBg="bg-slate-100 text-slate-600"
            title="Common Questions"
          >
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-dashboard-heading">If I turn off the program, do users lose their cashback balance?</p>
                <p className="text-dashboard-muted mt-0.5">No. Turning it off only stops <em>new</em> cashback from being earned. Whatever they already have stays in their cashback wallet.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">What if I change the percentage — does it affect past transactions?</p>
                <p className="text-dashboard-muted mt-0.5">No. Changes only affect <em>future</em> purchases. Past cashback is already credited and won&apos;t change.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">What if a service rule is OFF but the default % is set to 2%?</p>
                <p className="text-dashboard-muted mt-0.5">The user gets 0% for that service. When a rule exists but is OFF, we respect that — it means you specifically don&apos;t want cashback there. The default % only kicks in when there is <em>no rule at all</em>.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">Can I delete a rule?</p>
                <p className="text-dashboard-muted mt-0.5">Yes, but it&apos;s usually better to keep the rule and set it to 0% or toggle OFF. Deleting makes that service fall back to the default %, which might not be what you want.</p>
              </div>
            </div>
          </Accordion>

        </div>

        {/* Footer */}
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
