"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lightbulb,
  ChevronDown,
  Power,
  Gift,
  UserPlus,
  ShoppingCart,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

interface ReferralHowItWorksModalProps {
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

export function ReferralHowItWorksModal({ open, onClose }: ReferralHowItWorksModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-dashboard-surface rounded-2xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-2xl my-4 sm:my-8 overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-dashboard-surface border-b border-dashboard-border/60 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-bg-primary to-orange-600 flex items-center justify-center shadow-sm">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-dashboard-heading">How Referrals Work</h2>
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

          {/* Quick summary */}
          <div className="bg-brand-bg-primary/5 border border-brand-bg-primary/20 rounded-xl px-4 py-3">
            <p className="text-xs text-dashboard-heading leading-relaxed">
              <strong>In a nutshell:</strong> A referral is when an existing user (the <Highlight>referrer</Highlight>) invites someone new (the <Highlight>referee</Highlight>) to sign up on Smipay. If the new person signs up and meets a certain condition, BOTH of them get rewarded with money in their wallets.
            </p>
            <div className="mt-2.5 bg-white/60 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-dashboard-muted leading-relaxed">
                <strong className="text-dashboard-heading">Example:</strong> John&apos;s tag is &ldquo;johndoe&rdquo;. He tells Jane to sign up with his code. Jane signs up, enters &ldquo;johndoe&rdquo;, then buys ₦500 airtime. John gets <Highlight>₦200</Highlight> and Jane gets <Highlight>₦100</Highlight> in their wallets.
              </p>
            </div>
          </div>

          {/* Reward triggers */}
          <Accordion
            icon={Gift}
            iconBg="bg-emerald-100 text-emerald-600"
            title="When Do They Get Rewarded?"
            defaultOpen
          >
            <p className="text-dashboard-muted mb-2">
              That depends on the <strong>reward trigger</strong> setting. There are 3 options:
            </p>
            <div className="bg-dashboard-surface rounded-lg border border-dashboard-border/40 px-3 py-1">
              <TableRow
                label="First Transaction"
                description="Referee must complete their first purchase (airtime, fund wallet, etc.)"
                example="Lowest risk — recommended. Ensures the new user is real and active."
              />
              <TableRow
                label="KYC Verified"
                description="Referee must complete identity verification (submit ID)."
                example="Medium risk — proves they're a real person but may never use the app."
              />
              <TableRow
                label="Registration"
                description="Reward is given instantly when the referee signs up."
                example="Highest risk — people can create fake accounts to farm rewards."
              />
            </div>
          </Accordion>

          {/* Statuses */}
          <Accordion
            icon={UserPlus}
            iconBg="bg-blue-100 text-blue-600"
            title="What Do the Referral Statuses Mean?"
          >
            <div className="bg-dashboard-surface rounded-lg border border-dashboard-border/40 px-3 py-1">
              <TableRow
                label="🟡 Pending"
                description="New user signed up but hasn't met the reward trigger yet."
                example="You can Approve (force-pay) or Reject (block if fraudulent)."
              />
              <TableRow
                label="🔵 Eligible"
                description="Trigger was met but auto-payment may have failed. Usually brief."
                example="Click Approve to retry the reward payment."
              />
              <TableRow
                label="🟢 Rewarded"
                description="Both referrer and referee got their money. Done!"
              />
              <TableRow
                label="🟠 Partial"
                description="One person got their reward but the other didn't. Edge case."
                example="Investigate and Approve to retry the missing side."
              />
              <TableRow
                label="⚫ Expired"
                description="Referee never met the trigger within the expiry period (e.g. 90 days)."
                example="You can Approve to override expiry for special cases."
              />
              <TableRow
                label="🔴 Rejected"
                description="Admin manually rejected — suspected fake account or self-referral."
              />
            </div>
          </Accordion>

          {/* Settings */}
          <Accordion
            icon={Power}
            iconBg="bg-purple-100 text-purple-600"
            title="What Settings Can Admin Control?"
          >
            <div className="bg-dashboard-surface rounded-lg border border-dashboard-border/40 px-3 py-1">
              <TableRow
                label="Program ON/OFF"
                description="Master switch. When OFF, two things happen: (1) new users who enter a referral code during signup — the code is completely ignored, no referral record is created at all. (2) existing pending referrals waiting for a trigger — the reward will NOT be paid even if the user completes the trigger. The pending records are not deleted though — they just sit there. Turn it back ON and everything resumes normally."
                example="Turn OFF if you suspect fraud or want to pause temporarily. Turning it back ON resumes everything."
              />
              <TableRow
                label="Referrer Reward"
                description="How much ₦ the person who shared the code gets."
                example="Default ₦200 — increase to encourage more sharing."
              />
              <TableRow
                label="Referee Reward"
                description="How much ₦ the new user gets for signing up with a code."
                example="Default ₦100 — the incentive for new users to use a code."
              />
              <TableRow
                label="Reward Trigger"
                description="What the new user must do before rewards are paid out."
                example="'First Transaction' is safest. 'Registration' is riskiest."
              />
              <TableRow
                label="Max Per User"
                description="How many people one user can refer in total."
                example="Set to 50 — prevents one person from referring hundreds of fake accounts."
              />
              <TableRow
                label="Expiry Days"
                description="How long the referee has to meet the trigger before the referral expires."
                example="90 days — if they never transact in 90 days, referral expires."
              />
              <TableRow
                label="Min Tx Amount"
                description="Minimum ₦ the first transaction must be to count as the trigger."
                example="₦100 — prevents buying ₦10 airtime just to trigger the reward."
              />
            </div>
          </Accordion>

          {/* Flow */}
          <Accordion
            icon={ShoppingCart}
            iconBg="bg-orange-100 text-orange-600"
            title="The Full Flow — Step by Step"
          >
            <div className="space-y-1.5">
              {[
                ["1", "John shares his code \"johndoe\" with Jane", ""],
                ["2", "Jane signs up on Smipay and enters \"johndoe\"", "Referral created → status: pending"],
                ["3", "Jane buys ₦500 airtime (her first transaction)", "Trigger condition met"],
                ["4", "System checks: is program ON? ✓", ""],
                ["5", "System checks: trigger is first_transaction, Jane just did hers ✓", ""],
                ["6", "John's wallet gets +₦200, Jane's wallet gets +₦100", "Rewards credited"],
                ["7", "Referral status → rewarded", "Done!"],
              ].map(([step, action, note]) => (
                <div key={step} className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-brand-bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div className="flex-1">
                    <span className="text-dashboard-heading">{action}</span>
                    {note && (
                      <span className="text-emerald-600 font-medium ml-1">— {note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          {/* Common scenarios */}
          <Accordion
            icon={AlertTriangle}
            iconBg="bg-amber-100 text-amber-600"
            title="Common Scenarios & What To Do"
          >
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-dashboard-heading">&ldquo;I referred my friend but didn&apos;t get my reward&rdquo;</p>
                <ol className="mt-1.5 space-y-1 text-dashboard-muted list-decimal list-inside">
                  <li>Search for the referrer&apos;s name/email/tag in the referrals list</li>
                  <li><strong>Pending</strong> — friend signed up but hasn&apos;t transacted yet. Tell them to make a purchase.</li>
                  <li><strong>Eligible</strong> — trigger met but auto-payment failed. Click <strong>Approve</strong> to manually issue.</li>
                  <li><strong>Expired</strong> — friend took too long. You can <strong>Approve</strong> to override if you want.</li>
                  <li><strong>Rewarded</strong> — they already got paid. Check transaction history.</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">Suspected fake account farming</p>
                <ol className="mt-1.5 space-y-1 text-dashboard-muted list-decimal list-inside">
                  <li>Look for patterns: same device, rapid-fire referrals, inactive referee accounts</li>
                  <li><strong>Reject</strong> suspicious referrals — prevents rewards from being paid</li>
                  <li>Consider lowering max referrals per user or switching trigger to &ldquo;first_transaction&rdquo;</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">Running a referral promotion (double rewards)</p>
                <ol className="mt-1.5 space-y-1 text-dashboard-muted list-decimal list-inside">
                  <li>Go to Settings, change referrer reward to ₦400 and referee to ₦200</li>
                  <li>Save. All <em>new</em> referrals use the new amounts.</li>
                  <li>After the promo, change them back. Past rewards are unaffected.</li>
                </ol>
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
                <p className="font-semibold text-dashboard-heading">If I turn off the program, what happens exactly?</p>
                <p className="text-dashboard-muted mt-0.5">Two things: <strong>(1)</strong> New users who enter a referral code during signup — the code is completely ignored, no referral record is created at all. <strong>(2)</strong> Existing pending referrals waiting for a trigger (e.g. first transaction) — the reward will NOT be paid even if the user completes the trigger. However, the pending records are <em>not</em> deleted — they just sit there. If you turn the program back ON later and the user then does their first transaction, the reward kicks in normally.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">If I change reward amounts, does it affect past referrals?</p>
                <p className="text-dashboard-muted mt-0.5">No. Changes only affect <em>future</em> referrals. Already-rewarded referrals keep their original amounts.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">What if a service rule is OFF but the default % is set?</p>
                <p className="text-dashboard-muted mt-0.5">The referral program doesn&apos;t depend on cashback rules — those are separate systems. Referrals have their own ON/OFF switch.</p>
              </div>
              <div>
                <p className="font-semibold text-dashboard-heading">Can I approve an expired referral?</p>
                <p className="text-dashboard-muted mt-0.5">Yes! Click Approve on any expired referral to override and manually issue rewards. Useful for special cases or customer complaints.</p>
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
