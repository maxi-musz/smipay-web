const NF = new Intl.NumberFormat("en-NG");

export const fmtInt = (n: number | null | undefined) =>
  NF.format(Math.round(n ?? 0));

export const fmtMoney = (n: number | null | undefined) =>
  "₦" +
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(
    Math.round(n ?? 0),
  );

/** 0..1 rate → "94.2%". */
export const fmtRate = (n: number | null | undefined) =>
  `${((n ?? 0) * 100).toFixed(1)}%`;

/** already-a-percentage number → "+12.3%". */
export const fmtDelta = (n: number | null | undefined) =>
  `${(n ?? 0) >= 0 ? "+" : ""}${(n ?? 0).toFixed(1)}%`;

export const fmtDateShort = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric" });

/** Compact currency for axis ticks: ₦1.2M, ₦850K. */
export const fmtMoneyCompact = (n: number | null | undefined) => {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${Math.round(v)}`;
};

export const fmtIntCompact = (n: number | null | undefined) => {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};

/** Categorical palette (brand orange first). */
export const PALETTE = [
  "#ea6c0b",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#ca8a04",
  "#dc2626",
  "#4f46e5",
  "#0d9488",
];

export const BRAND = "#ea6c0b";
export const AXIS_COLOR = "#94a3b8";
export const GRID_COLOR = "#e2e8f0";
