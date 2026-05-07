/**
 * Resolves a public bank-logo URL from `bank_name`. Mirrors mobile's
 * `mobile/src/lib/bank-logo.ts` so both clients render the same logo for
 * the same bank.
 *
 * Logos live in `web/public/imgs/bank-logo/*` and are served from the root
 * (e.g. `/imgs/bank-logo/wema-logo.jpg`).
 */

interface LogoEntry {
  /** Lowercase substrings to match against `bank_name`. */
  keywords: string[];
  /** Public URL relative to the site root. */
  src: string;
}

const BANK_LOGOS: LogoEntry[] = [
  {
    keywords: ["wema"],
    src: "/imgs/bank-logo/wema-logo.jpg",
  },
];

/**
 * Returns a public URL for the bank logo, or `null` when no match exists —
 * callers should fall back to a generic icon in that case.
 */
export function getBankLogo(bankName: string | null | undefined): string | null {
  const lower = (bankName ?? "").toLowerCase();
  if (!lower) return null;

  for (const entry of BANK_LOGOS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.src;
    }
  }

  return null;
}
