# Dashboard API Endpoint

## Base Path
`/api/v1/unified-admin/dashboard`

**Auth:** JWT Bearer token (admin role required)

---

## 1. Get Dashboard Stats
**GET** `/api/v1/unified-admin/dashboard`

No query params, no payload. Returns all stats in a single call.

**Response:**
```json
{
  "success": true,
  "message": "Dashboard stats fetched",
  "data": {
    "users": {
      "total": 1250,
      "new_today": 14,
      "new_this_week": 87,
      "active": 1200,
      "suspended": 50,
      "verification": {
        "total": 1238,
        "bvn_verified": 412,
        "phone_verified": 905,
        "email_verified": 1236,
        "phone_and_bvn": 398,
        "unverified": 319
      }
    },
    "transactions": {
      "total_today": 342,
      "total_volume_today": 4500000.00,
      "pending_count": 12,
      "failed_count": 5,
      "success_count": 325
    },
    "support": {
      "open_tickets": 8,
      "pending_tickets": 3,
      "escalated_tickets": 1
    },
    "wallets": {
      "total_balance_all_users": 125000000.00,
      "total_funded_today": 3200000.00
    },
    "kyc": {
      "pending": 0,
      "approved_today": 0,
      "approved_this_week": 0,
      "rejected": 0
    },
    "bvn": {
      "verified_total": 412,
      "verified_today": 9,
      "pending_otp": 4,
      "failed_today": 2
    },
    "compliance": {
      "flagged_audit_logs": 3,
      "security_events_today": 2
    },
    "cards": {
      "total_active": 1500,
      "issued_today": 5
    },
    "referrals": {
      "today": 4,
      "this_week": 28
    },
    "tier_distribution": {
      "UNVERIFIED": 200,
      "VERIFIED": 800,
      "PREMIUM": 250
    },
    "revenue": {
      "markup_today": 125000.00,
      "markup_this_week": 850000.00,
      "vtpass_commission_today": 18500.00,
      "vtpass_commission_this_week": 112000.00,
      "total_revenue_today": 143500.00,
      "total_revenue_this_week": 962000.00,
      "this_month": {
        "markup": 2100000.00,
        "vtpass_commission": 285000.00,
        "total": 2385000.00
      },
      "last_month": {
        "markup": 1950000.00,
        "vtpass_commission": 262000.00,
        "total": 2212000.00
      },
      "all_time": {
        "markup": 18500000.00,
        "vtpass_commission": 2450000.00,
        "total": 20950000.00
      }
    },
    "action_items": [
      { "type": "escalated_tickets", "count": 1 },
      { "type": "flagged_audits", "count": 3 },
      { "type": "pending_kyc", "count": 12 },
      { "type": "pending_transactions", "count": 5 }
    ]
  }
}
```

---

## Response Field Reference

### `users`
| Field | Type | Description |
|---|---|---|
| `total` | number | Total registered users |
| `new_today` | number | Users registered today |
| `new_this_week` | number | Users registered in the last 7 days |
| `active` | number | Users with `active` account status |
| `suspended` | number | Users with `suspended` account status |
| `verification` | object \| null \| absent | Live customer verification counts (see below). `null` when the count query failed; absent on an older backend. |

### `users.verification`
Counted live on every request (memoised 60s server-side), **customers only**: `role` is null, `user` or `agent` — staff accounts are excluded.

| Field | Type | Description |
|---|---|---|
| `total` | number | Customers. **The denominator for every percentage** — never divide by `users.total`, which is a drifting counter over all roles and can be lower than a live numerator. |
| `bvn_verified` | number | BVN verified (`bvn_verifications.is_verified` or the legacy `KycVerification.bvn_verified`) |
| `phone_verified` | number | `is_phone_verified` |
| `email_verified` | number | `is_email_verified`. Both sign-up flows set it, so it sits near 100% by design. |
| `phone_and_bvn` | number | Phone **and** BVN verified |
| `unverified` | number | **Neither** phone nor BVN verified (email ignored) |

### `transactions`
| Field | Type | Description |
|---|---|---|
| `total_today` | number | Number of transactions created today |
| `total_volume_today` | number | Total successful transaction amount today (NGN) |
| `pending_count` | number | Transactions currently in `pending` state |
| `failed_count` | number | Transactions that failed today |
| `success_count` | number | Transactions that succeeded today |

### `support`
| Field | Type | Description |
|---|---|---|
| `open_tickets` | number | Tickets with `in_progress` status |
| `pending_tickets` | number | Tickets with `pending` status (awaiting first response) |
| `escalated_tickets` | number | Tickets with `escalated` status |

### `wallets`
| Field | Type | Description |
|---|---|---|
| `total_balance_all_users` | number | Sum of all user wallet balances (NGN) |
| `total_funded_today` | number | Total amount funded into wallets today (NGN) |

### `kyc` (legacy, not rendered)
Counters from the old `KycVerification` submission flow, kept for API compatibility. The dashboard no longer shows them.

| Field | Type | Description |
|---|---|---|
| `pending` | number | Legacy KYC submissions awaiting review |
| `approved_today` | number | Legacy approvals today |
| `approved_this_week` | number | Legacy approvals in the last 7 days |
| `rejected` | number | Legacy rejections today |

### `bvn`
Live counts from `bvn_verifications`, cached ~60s server-side. `null` when the count failed; absent on an older backend. "Today" is the Africa/Lagos calendar day.

| Field | Type | Description |
|---|---|---|
| `verified_total` | number | BVN-verified rows, all time |
| `verified_today` | number | Verified today |
| `pending_otp` | number | A code was sent, not yet confirmed, and is still within its expiry window (expired codes are not counted) |
| `failed_today` | number | Failed attempts whose last change was today |

### `compliance`
| Field | Type | Description |
|---|---|---|
| `flagged_audit_logs` | number | Audit log entries flagged for compliance review |
| `security_events_today` | number | Security events logged today |

### `cards`
| Field | Type | Description |
|---|---|---|
| `total_active` | number | Total active virtual cards |
| `issued_today` | number | Cards issued today |

### `referrals`
| Field | Type | Description |
|---|---|---|
| `today` | number | Referrals created today |
| `this_week` | number | Referrals created in the last 7 days |

### `tier_distribution`
| Field | Type | Description |
|---|---|---|
| `{TIER_NAME}` | number | Number of users in each tier. Keys are tier names (e.g. `"UNVERIFIED"`, `"VERIFIED"`, `"PREMIUM"`). Dynamic — depends on tiers configured in the system. |

### `revenue` — Revenue breakdown (VTU / bill payments)

| Field | Type | Description |
|---|---|---|
| `markup_today` | number | Our margin today (Smipay price − VTpass price) in NGN |
| `markup_this_week` | number | Our margin over the last 7 days (NGN) |
| `vtpass_commission_today` | number | VTpass commission from successful purchases today (NGN) |
| `vtpass_commission_this_week` | number | VTpass commission over the last 7 days (NGN) |
| `total_revenue_today` | number | `markup_today` + `vtpass_commission_today` (NGN) |
| `total_revenue_this_week` | number | `markup_this_week` + `vtpass_commission_this_week` (NGN) |
| `this_month` | object | Current month to date: `{ markup, vtpass_commission, total }` (NGN) |
| `last_month` | object | Previous full month: `{ markup, vtpass_commission, total }` (NGN) |
| `all_time` | object | Since launch: `{ markup, vtpass_commission, total }` (NGN) |

Frontend can show separate cards for “Markup revenue” and “Commission” and a combined “Total revenue”, or a single revenue card with a breakdown (e.g. “Total: ₦143,500 — Markup: ₦125,000 | Commission: ₦18,500”).

**This month, last month, all time:** `revenue.this_month`, `revenue.last_month`, and `revenue.all_time` each expose `{ markup, vtpass_commission, total }` in NGN for the current month, previous month, and all-time totals. Use for period tabs or cards (e.g. "This month", "Last month", "All time") with markup vs commission breakdown.

### `action_items`
Array of items requiring admin attention. Each item:

| Field | Type | Description |
|---|---|---|
| `type` | string | One of: `"escalated_tickets"`, `"flagged_audits"`, `"pending_kyc"`, `"pending_transactions"` |
| `count` | number | Number of items needing attention |

Only items with `count > 0` are included. If everything is clear, this array is empty.

---

## 2. Recalculate Stats
**POST** `/api/v1/unified-admin/dashboard/recalculate`

Re-syncs all stats from actual database data. Use this after first deploy or if counters drift.

**Payload:** None

**Response:** Same structure as `GET /dashboard` above, with message `"Stats recalculated successfully"`.

---

## Frontend Implementation Notes

- **Polling:** Safe to poll every 30–60 seconds. The endpoint reads from pre-aggregated stats tables, except `users.verification` and `bvn`, which are live counts memoised for 60s.
- **Action items:** Use this array to show notification badges or an "Attention needed" section on the dashboard.
- **Verified Users card:** the first stat card shows `verification.bvn_verified` as the headline with a share bar, then rows Phone verified · Email verified (greyed, "set at sign-up") · Phone + BVN · Unverified, each as a share of `verification.total`, and the footer "of N customers · +X today". The "Users" section card lists the same counts. When `verification` is `null`/absent the card falls back to the old "Total Users" (`users.total`). Shared UI: `app/unified-admin/_components/VerificationBreakdownList.tsx`; type + `pct()`/`formatPct()` helpers: `types/admin/verification.ts`.
- **BVN widgets:** the second-row stat card "BVN Verified Today" (`bvn.verified_today`, subtitle "N awaiting code (unexpired) · N failed today") and the "BVN Verification" section card (all time, today, awaiting code (unexpired), failed today; the pending count has a hover hint) replace the legacy "Pending KYC" and "KYC Verification" widgets. When `bvn` is `null`/absent both show "Not available"; they never fall back to the legacy `kyc` block.
- **Tier distribution:** Render as a pie/donut chart. Keys are dynamic — iterate over the object.
- **Revenue:** Breakdown into **markup** (our margin on VTU/bill payments) and **vtpass_commission** (commission from VTpass). Available for today, this week, this month, last month, and all time. Use `revenue.this_month`, `revenue.last_month`, `revenue.all_time` for period comparisons. Values are `0` when no VTU transactions in that period.
- **Number formatting:** All monetary values are in NGN (Nigerian Naira). Format with commas and 2 decimal places on the frontend.
