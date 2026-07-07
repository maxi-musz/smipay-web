export const TRANSACTION_RAIL_PARTNERS = [
  "paystack",
  "flutterwave",
  "vtpass",
  "sagecloud",
  "bridge",
  "smipay",
  "giftbill",
  "monnify",
  "wema",
  "unknown",
] as const;

export type TransactionRailPartner = (typeof TRANSACTION_RAIL_PARTNERS)[number];

const PARTNER_LABELS: Record<TransactionRailPartner, string> = {
  paystack: "Paystack",
  flutterwave: "Flutterwave",
  vtpass: "VTPass",
  sagecloud: "SageCloud",
  bridge: "Bridge",
  smipay: "SmiPay",
  giftbill: "GiftBill",
  monnify: "Monnify",
  wema: "Wema",
  unknown: "Unknown",
};

/** Badge colours aligned with admin table chips. */
export const PARTNER_BADGE_CLASS: Record<TransactionRailPartner, string> = {
  paystack: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
  flutterwave: "bg-orange-50 text-orange-800 border-orange-200/80",
  vtpass: "bg-violet-50 text-violet-800 border-violet-200/80",
  sagecloud: "bg-sky-50 text-sky-800 border-sky-200/80",
  bridge: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
  smipay: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  giftbill: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200/80",
  monnify: "bg-amber-50 text-amber-900 border-amber-200/80",
  wema: "bg-rose-50 text-rose-800 border-rose-200/80",
  unknown: "bg-slate-100 text-slate-600 border-slate-200/80",
};

const UTILITY_TRANSACTION_TYPES = new Set([
  "airtime",
  "data",
  "cable",
  "electricity",
  "education",
  "betting",
]);

const KNOWN_RAIL_SLUGS = new Set([
  "paystack",
  "flutterwave",
  "vtpass",
  "sagecloud",
  "bridge",
  "bridgecard",
  "smipay",
  "giftbill",
  "monnify",
  "wema",
]);

/** Client-side fallback when API has not yet sent rail_partner (or legacy rows). */
export function resolveTransactionPartnerFromRow(row: {
  rail_partner?: string | null;
  payment_channel?: string | null;
  payment_method?: string | null;
  provider?: string | null;
  transaction_type?: string | null;
}): TransactionRailPartner {
  if (row.rail_partner && row.rail_partner !== "unknown") {
    const slug = row.rail_partner.toLowerCase() as TransactionRailPartner;
    return TRANSACTION_RAIL_PARTNERS.includes(slug) ? slug : "unknown";
  }

  const channel = row.payment_channel?.trim().toLowerCase() ?? "";
  const provider = row.provider?.trim().toLowerCase() ?? "";
  const txType = row.transaction_type?.trim().toLowerCase() ?? "";

  if (provider && KNOWN_RAIL_SLUGS.has(provider)) {
    return provider === "bridgecard" ? "bridge" : (provider as TransactionRailPartner);
  }
  if (channel === "paystack") return "paystack";
  if (channel === "flutterwave") return "flutterwave";
  if (channel === "smipay_tag") return "smipay";
  if (txType && UTILITY_TRANSACTION_TYPES.has(txType)) return "vtpass";
  if (txType === "deposit" && row.payment_method === "bank_transfer") return "paystack";
  if (txType === "transfer" && channel === "other" && row.payment_method === "wallet") {
    return "paystack";
  }
  if (txType === "referral_bonus") return "smipay";

  return "unknown";
}

export function formatTransactionPartnerLabel(
  partner: string | null | undefined,
): string {
  if (!partner) return "—";
  const key = partner.toLowerCase() as TransactionRailPartner;
  return PARTNER_LABELS[key] ?? partner;
}

export function partnerBadgeClass(partner: string | null | undefined): string {
  if (!partner) return PARTNER_BADGE_CLASS.unknown;
  const key = partner.toLowerCase() as TransactionRailPartner;
  return PARTNER_BADGE_CLASS[key] ?? PARTNER_BADGE_CLASS.unknown;
}
