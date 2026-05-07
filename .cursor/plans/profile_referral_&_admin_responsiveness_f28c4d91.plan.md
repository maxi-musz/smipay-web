---
name: Profile Referral & Admin Responsiveness
overview: Add referral code and full referral analysis to the user profile page, and fix admin layout scroll + Fraud Indicators card height so all unified-admin pages are usable on 11-inch laptops without zooming out.
todos: []
isProject: false
---

# Profile Referral & Admin Responsiveness Fix

## 1. Profile Page — Referral Code & Referral Analysis

**Problem:** The backend returns `referral_code`, `smipay_tag`, and `referral_analysis` from `GET /user/fetch-user-profile`, but the profile page does not display them.

**Files to modify:**

- `[types/user.ts](types/user.ts)` — Add `referral_code?: string` to the user object in `UserProfile`, and add `referral_analysis?: ReferralAnalysis` with the full type from the API doc
- `[app/dashboard/settings-profile/page.tsx](app/dashboard/settings-profile/page.tsx)` — Add a new "Referral" tab or section

**Implementation:**

- Add `ReferralAnalysis` interface and `referral_analysis` to `UserProfile` in `types/user.ts` (fields: `total_referred`, `by_status`, `referrer_rewards_issued`, `referrer_rewards_total_amount`, `referee_rewards_issued`, `referee_rewards_total_amount`, `slots_remaining`, `program_config`)
- Add `referral_code?: string` to the user object (API doc: use `smipay_tag` if `referral_code` is empty)
- Add a **Referral** tab to the profile page TABS array
- In the Referral tab content:
  - **Referral Code card**: Prominent display of `referral_code || smipay_tag` with a copy-to-clipboard button (reuse pattern from `app/dashboard/transactions/[id]/page.tsx` — `navigator.clipboard.writeText`)
  - **Referral Analysis card**: Display `total_referred`, status breakdown (`by_status`), rewards earned (`referrer_rewards_total_amount`), referee rewards, `slots_remaining`, and program config (reward amounts, trigger, max referrals)
- Use theme colors: `bg-brand-bg-primary` for primary CTAs, `text-dashboard-heading`, `text-dashboard-muted`, `border-dashboard-border/60`, `rounded-2xl`, `font-funnel-display` (body font)

---

## 2. Admin Layout — Scroll Fix (Root Cause)

**Problem:** The main content area has `overflow-hidden` and `h-screen max-h-screen`, so content cannot scroll. On 11-inch laptops, the audit log table and other content are cut off; users must zoom out to 70% to see them.

**Root cause:** `[app/unified-admin/_components/AdminLayout.tsx](app/unified-admin/_components/AdminLayout.tsx)` line 184:

```tsx
<main className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden admin-content-area">
```

**Fix:** Change `main` to allow vertical scrolling when content overflows:

```tsx
<main className="flex-1 flex flex-col min-h-0 overflow-y-auto admin-content-area">
```

- Remove `h-screen max-h-screen overflow-hidden`
- Add `min-h-0` — critical for flexbox: allows the flex child to shrink below its content size so the scroll container works
- Add `overflow-y-auto` — enables vertical scroll when content exceeds viewport

This single change fixes scroll for **all** admin pages (audit-logs, users, transactions, support, notifications, referrals, cashback, first-tx-reward, dashboard) because they all render inside this `main`.

---

## 3. Audit Logs — Fraud Indicators Card Height

**Problem:** The three cards (Category Breakdown, Severity Breakdown, Fraud Indicators) are in a `grid grid-cols-1 lg:grid-cols-3`. The Fraud Indicators card has long lists (Top Failed Actions, Suspicious Users, Multi-Account IPs) and expands the entire row, making all three cards very tall.

**File:** `[app/unified-admin/audit-logs/_components/AuditAnalytics.tsx](app/unified-admin/audit-logs/_components/AuditAnalytics.tsx)`

**Fix:** Constrain the three cards to a reasonable max height and make the Fraud Indicators content scroll internally:

- Add `max-h-64` (or `max-h-72`) to each of the three cards in the Row 2 grid (Category, Severity, Fraud)
- On the Fraud Indicators card, wrap the expandable content (`{fraudOpen && (...)}`) in a scrollable container: `max-h-48 overflow-y-auto` so long lists scroll inside the card instead of stretching it
- Use `items-start` on the grid so cards align to top and don’t stretch to match the tallest

---

## 4. Verification

- **Profile:** Confirm `referral_code` / `smipay_tag` and `referral_analysis` display correctly; copy button works
- **Admin scroll:** On a ~1024px-wide viewport (or 11-inch laptop), open audit-logs, users, transactions, support — main content should scroll vertically
- **Audit cards:** Category, Severity, and Fraud cards stay compact; Fraud card content scrolls internally when long

---

## Summary of File Changes


| File                                                          | Change                                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `types/user.ts`                                               | Add `referral_code`, `ReferralAnalysis` type, `referral_analysis` to `UserProfile` |
| `app/dashboard/settings-profile/page.tsx`                     | Add Referral tab with code display + copy, full referral analysis                  |
| `app/unified-admin/_components/AdminLayout.tsx`               | Replace `h-screen max-h-screen overflow-hidden` with `min-h-0 overflow-y-auto`     |
| `app/unified-admin/audit-logs/_components/AuditAnalytics.tsx` | Add `max-h-64` to three cards, `max-h-48 overflow-y-auto` on Fraud content         |


No logic changes, no API changes, no breaking changes. Theme and fonts remain as configured in `globals.css` and `app/layout.tsx`.