"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lightbulb,
  ChevronDown,
  Power,
  Sparkles,
  ShoppingCart,
  Settings,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

interface FirstTxRewardHowItWorksModalProps {
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
    <span className="bg-brand-bg-primary/10 text-brand-bg-primary px-1.5 py-0.5 rounded font-semibold text-[11px]">
      {children}
    </span>
  );
}

function TableRow({ label, description, example }: { label: string; description: string; example?: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 py-2 border-b border-dashboard-border/30 last:border-0">
      <span className="font-semibold text-dashboard-heading sm:w-44 flex-shrink-0">{label}</span>
      <div className="flex-1">
        <p className="text-dashboard-muted">{description}</p>
        {example && (
          <p className="text-[10px] text-brand-bg-primary mt-0.5 italic">{example}</p>
        )}
      </div>
    </div>
  );
}

export function FirstTxRewardHowItWorksModal({ open, onClose }: FirstTxRewardHowItWorksModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-dashboard-surface rounded-2xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-2xl my-4 sm:my-8 overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dashboard-surface border-b border-dashboard-border/60 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-bg-primary to-orange-600 flex items-center justify-center shadow-sm">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-dashboard-heading">How First Tx Reward Works</h2>
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

        {/* Body */}
        <div className="px-4 sm:px-6 py-5 space-y-3 max-h-[75vh] overflow-y-auto">

          {/* Quick summary */}
          <div className="bg-brand-bg-primary/5 border border-brand-bg-primary/20 rounded-xl px-4 py-3">
            <p className="text-xs text-dashboard-heading leading-relaxed">
              <strong>In a nutshell:</strong> The First Transaction Reward is a <Highlight>one-time bonus</Highlight> we give to users the moment they complete their very first transaction on Smipay. It&apos;s a welcome incentive &mdash; &ldquo;congratulations on your first purchase, here&apos;s money on us.&rdquo; The user receives it once, ever.
            </p>
            <div className="mt-2.5 bg-white/60 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-dashboard-muted leading-relaxed">
                <strong className="text-dashboard-heading">Example:</strong> A brand new user buys ₦500 airtime. The system detects this is their very first successful transaction, and instantly credits <Highlight>₦100</Highlight> into their main wallet. They see it in their history: &ldquo;First transaction bonus.&rdquo;
              </p>
            </div>
          </div>

          {/* Why it matters */}
          <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-blue-800 mb-1.5">Why does this matter?</p>
            <ul className="space-y-1 text-[11px] text-blue-700 leading-relaxed">
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">&bull;</span> Getting a user to do their <strong>first transaction</strong> is the hardest part in fintech</li>
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">&bull;</span> After that first purchase, they&apos;re 5x more likely to come back</li>
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">&bull;</span> This reward removes friction &mdash; &ldquo;try us once, and we&apos;ll literally pay you for it&rdquo;</li>
              <li className="flex gap-2"><span className="text-blue-400 mt-0.5">&bull;</span> OPay, PalmPay, and every serious fintech runs a variant of this</li>
            </ul>
          </div>

          {/* How it differs from referrals */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 mb-1.5">How is this different from referral rewards?</p>
            <ul className="space-y-1 text-[11px] text-amber-700 leading-relaxed">
              <li className="flex gap-2"><span className="text-amber-400 mt-0.5">&bull;</span> <strong>Who gets it?</strong> Every user who does their first transaction (not just referred users)</li>
              <li className="flex gap-2"><span className="text-amber-400 mt-0.5">&bull;</span> <strong>How many times?</strong> Once, ever per user</li>
              <li className="flex gap-2"><span className="text-amber-400 mt-0.5">&bull;</span> <strong>Can stack?</strong> Yes &mdash; a user can get BOTH the first-tx bonus AND a referral bonus on the same transaction</li>
            </ul>
          </div>

          {/* Config settings */}
          <Accordion
            icon={Settings}
            iconBg="bg-purple-100 text-purple-600"
            title="Config Settings — What Each One Does"
            defaultOpen
          >
            <div className="bg-dashboard-surface rounded-lg border border-dashboard-border/40 px-3 py-1">
              <TableRow
                label="Program ON/OFF"
                description="Master switch. If OFF, nobody gets the first-tx bonus, no matter what. Existing rewards already given are not affected."
                example="Turn ON when ready to launch. Turn OFF if costs are too high."
              />
              <TableRow
                label="Reward Amount"
                description="How much ₦ the user gets. Goes straight into their main wallet."
                example="₦100 — enough to feel real, not so much it bleeds money."
              />
              <TableRow
                label="Min Transaction Amt"
                description="The user's first transaction must be at least this ₦ to qualify. Prevents gaming with tiny purchases."
                example="₦100 — buying ₦50 airtime gives nothing, ₦100+ qualifies."
              />
              <TableRow
                label="Eligible Tx Types"
                description="Which transaction types count. Customize this list to only incentivize what matters."
                example="Default: all types. Remove 'betting' if you don't want to incentivize gambling."
              />
              <TableRow
                label="Budget Limit"
                description="Total ₦ you're willing to spend. Once reached, system stops giving rewards. Leave empty for unlimited."
                example="₦1,000,000 — after ₦1M in bonuses, the program auto-stops."
              />
              <TableRow
                label="Max Recipients"
                description="Maximum users who can receive the bonus. Leave empty for unlimited."
                example="500 — 'first 500 users get a bonus' promo."
              />
              <TableRow
                label="Start / End Date"
                description="Time window for the program. Leave empty for always-on."
                example="Mar 1 – Mar 31 — the promo runs for one month only."
              />
              <TableRow
                label="Require KYC"
                description="If ON, user must be KYC-verified to receive the bonus."
                example="OFF by default — don't gate a welcome reward behind KYC."
              />
            </div>
          </Accordion>

          {/* Step-by-step flow */}
          <Accordion
            icon={ShoppingCart}
            iconBg="bg-orange-100 text-orange-600"
            title="What Happens When a User Does Their First Transaction"
          >
            <p className="text-dashboard-muted mb-2">
              A new user buys <strong>₦500 airtime</strong> and the reward is set to <strong>₦100</strong>:
            </p>
            <div className="space-y-1.5">
              {[
                ["1", "Is the first-tx reward program ON?", "Yes ✓"],
                ["2", "Is today within the start/end date window?", "Yes ✓"],
                ["3", 'Is "airtime" in the eligible tx types?', "Yes ✓"],
                ["4", "Is ₦500 >= min transaction amount (₦100)?", "Yes ✓"],
                ["5", "Has this user already received a first-tx bonus?", "No ✓"],
                ["6", "Is this their first successful transaction?", "Yes ✓"],
                ["7", "Is KYC required? (No, or yes and verified)", "Pass ✓"],
                ["8", "Have we hit the recipient cap? (342 of 500)", "No ✓"],
                ["9", "Have we hit the budget limit? (₦34.2K of ₦100K)", "No ✓"],
                ["10", "Credit ₦100 to user's main wallet", "Done! ✓"],
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
              If ANY check fails, the user simply doesn&apos;t get the bonus. No error, no notification &mdash; it&apos;s silent. The bonus is a pleasant surprise, not something users should expect.
            </p>
          </Accordion>

          {/* First-time setup */}
          <Accordion
            icon={Sparkles}
            iconBg="bg-emerald-100 text-emerald-600"
            title="First-Time Setup Guide"
          >
            <div className="space-y-2">
              {[
                "Open the First Transaction Reward page in admin (you're here!)",
                "Set the Reward Amount — e.g. ₦100",
                "Set the Min Transaction Amount — e.g. ₦100",
                "Decide on limits: budget cap? Recipient cap? Time window? Or leave all empty for unlimited.",
                "Choose which Eligible Transaction Types qualify (default: all types)",
                "Toggle Program Active to ON",
                "Save — users will now start receiving the bonus on their first qualifying transaction!",
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

          {/* Gaming warning */}
          <Accordion
            icon={AlertTriangle}
            iconBg="bg-amber-100 text-amber-600"
            title="Watch Out For — Gaming & Edge Cases"
          >
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-dashboard-heading">Can a user game this with a tiny transaction?</p>
                <p className="text-dashboard-muted mt-0.5">Not if you set a sensible <strong>Min Transaction Amount</strong>. If it&apos;s set to ₦100, a ₦10 purchase won&apos;t trigger the bonus &mdash; but that ₦10 purchase IS now their first transaction, so a later ₦500 purchase is their SECOND transaction and still won&apos;t qualify. The system only rewards the literal first successful qualifying transaction.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">What if a user&apos;s first transaction fails?</p>
                <p className="text-dashboard-muted mt-0.5">Failed transactions don&apos;t count. If their first attempt fails and the second succeeds, the second one is their &ldquo;first successful transaction&rdquo; and qualifies.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">What if the budget runs out mid-day?</p>
                <p className="text-dashboard-muted mt-0.5">The system checks the budget before every reward. Once total_given &ge; budget_limit, no more rewards. You can increase the budget at any time and rewards will resume.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">Can a user get BOTH the first-tx reward AND a referral reward?</p>
                <p className="text-dashboard-muted mt-0.5">Yes. They are completely independent systems. A referred user doing their first purchase can receive: (1) the first-tx bonus, (2) the referral referee reward, AND the referrer gets their reward too. All three fire independently.</p>
              </div>
            </div>
          </Accordion>

          {/* FAQ */}
          <Accordion
            icon={HelpCircle}
            iconBg="bg-slate-100 text-slate-600"
            title="Common Questions"
          >
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-dashboard-heading">If I turn off the program, do users lose their bonus?</p>
                <p className="text-dashboard-muted mt-0.5">No. Turning it off only stops NEW bonuses from being issued. Money already credited stays in their wallets.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">If I change the reward amount, does it affect past rewards?</p>
                <p className="text-dashboard-muted mt-0.5">No. Past rewards are already credited at whatever amount was set at the time. The new amount only applies to future bonuses.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">What if I want to run this for &ldquo;March only&rdquo; then stop?</p>
                <p className="text-dashboard-muted mt-0.5">Set <strong>Start Date</strong> to March 1 and <strong>End Date</strong> to March 31. The program auto-stops after the end date &mdash; you don&apos;t need to manually turn it off.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">What if max_recipients hits the cap?</p>
                <p className="text-dashboard-muted mt-0.5">The system stops giving rewards. Admin sees &ldquo;Recipient Slots Remaining: 0.&rdquo; Increase the cap to resume.</p>
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
