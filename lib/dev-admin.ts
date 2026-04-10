/**
 * Admin UI visibility for developer accounts.
 * Source: DEV_EMAILS in .env, forwarded to the client as NEXT_PUBLIC_DEV_EMAILS (see next.config.ts).
 */
function parseDevEmails(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(/[,\n;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isDevAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const allowed = parseDevEmails(process.env.NEXT_PUBLIC_DEV_EMAILS);
  return allowed.has(email.trim().toLowerCase());
}
