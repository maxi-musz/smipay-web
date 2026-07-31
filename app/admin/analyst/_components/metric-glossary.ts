/** Plain-language explanations for analytics metrics (hover tooltips). */
export const METRIC_HELP = {
  totalUsers:
    "All registered SmiPay accounts, including inactive ones.",
  newUsers:
    "Accounts created during the date range you selected.",
  dau:
    "Daily Active Users — how many different people successfully logged in on the last day of your selected range.",
  wau:
    "Weekly Active Users — unique users who logged in at least once in the 7 days ending on the range end date.",
  mau:
    "Monthly Active Users — unique users who logged in at least once in the 30 days ending on the range end date.",
  stickiness:
    "How often monthly users come back daily. Calculated as DAU ÷ MAU — higher means people use the app more regularly.",
  activeUsers:
    "Unique users who successfully logged in at least once during the selected date range.",
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
    "How many users completed each step: registered → email verified → phone verified.",
  failedLoginWatchlist:
    "Users or sign-in identifiers with the most failed login attempts. Email and phone are masked. IP and location are shown for context.",
  revenueByService:
    "Markup earned broken down by transaction type (airtime, transfers, etc.).",
  deviceActivityNote:
    "Counts are based on activity events (logins, actions), not unique users — one person can contribute many events.",
} as const;
