/** Plain-language explanations for analytics metrics (hover tooltips). */
export const METRIC_HELP = {
  totalUsers:
    "All registered SmiPay accounts, including inactive ones and staff accounts.",
  phoneVerified:
    "Customers (staff excluded) who confirmed their phone number by SMS — the minimum sign of a real person. All-time, not limited to the date range. Email is not used: it is marked verified for everyone at sign-up.",
  verifiedSignups:
    "Customer sign-ups in the date range whose phone is verified. Sign-ups that never verify are mostly bots and farmed accounts, so they are left out.",
  activeVerified:
    "Phone-verified customers who successfully logged in during the date range, out of all customers who logged in.",
  newUsers:
    "Every account created in the date range, including sign-ups that never verified their phone.",
  dau:
    "Daily Active Users — phone-verified customers who successfully logged in on the last day of the range. The small print is everyone who logged in, unverified accounts included.",
  wau:
    "Weekly Active Users — phone-verified customers who logged in during the 7 days ending on the range end date. The small print is everyone who logged in.",
  mau:
    "Monthly Active Users — phone-verified customers who logged in during the 30 days ending on the range end date. The small print is everyone who logged in.",
  stickiness:
    "How often verified monthly users come back daily: verified DAU ÷ verified MAU. Higher means people use the app more regularly.",
  mauAll:
    "Monthly Active Users — every account (any role, verified or not) that logged in during the 30 days ending on the range end date.",
  stickinessAll:
    "How often monthly users come back daily: DAU ÷ MAU across all accounts. Higher means people use the app more regularly.",
  activeUsers:
    "Every account (any role, verified or not) that successfully logged in during the date range.",
  txVolume:
    "Total naira value of all transactions processed in the period.",
  successRate:
    "Share of transactions that completed successfully (not failed or still pending).",
  revenue:
    "Markup plus provider commission earned from successful transactions in the period.",
  logins:
    "Successful sign-in attempts during the selected period.",
  failedLogins:
    "Sign-in attempts that failed — wrong password, locked account, and similar.",
  loginSuccessRate:
    "Successful logins as a percentage of all login attempts (success + failed).",
  otpRequests:
    "One-time codes sent for email/phone verification or password reset.",
  transactions:
    "Number of transaction records in the period (all types unless filtered).",
  volume:
    "Total naira amount moved across all transactions in the period.",
  avgValue:
    "Average transaction size — total volume divided by transaction count.",
  markupRevenue:
    "Extra fee SmiPay earns on top of the base service price for each transaction.",
  grossRevenue:
    "Total earnings from markup fees and provider commission combined.",
  markup:
    "Revenue from SmiPay's service fees added to transaction prices.",
  commission:
    "Revenue earned from provider commissions (e.g. VTpass bill payments).",
  funded:
    "Total money users added to their wallets via deposits or funding.",
  payouts:
    "Bonuses paid out to users — referral rewards and first-transaction bonuses.",
  netRevenue:
    "What SmiPay keeps after payouts — gross revenue minus bonuses paid to users.",
  verificationFunnel:
    "Customers (staff excluded): registered → phone verified → phone + BVN verified. Each step is a subset of the one before, so the drop between steps is real drop-off.",
  signupSplit:
    "Customer sign-ups per day, split by whether the phone is verified now. A spike of not-verified sign-ups is usually a bot or farming wave.",
  cumulativeSplit:
    "Running total of all accounts next to the running total of phone-verified customers. The gap between the lines is accounts that never proved a real phone.",
  failedLoginWatchlist:
    "Users or sign-in identifiers with the most failed login attempts. Email and phone are masked. IP and location are shown for context.",
  revenueByService:
    "Markup earned broken down by transaction type (airtime, transfers, etc.).",
  deviceActivityNote:
    "Counts are based on activity events (logins, actions), not unique users — one person can contribute many events.",
} as const;
