import type { EffectiveModule, MePermissions } from "@/types/admin/management";

/**
 * Route ↔ module resolution for the unified-admin panel.
 *
 * Everything here is derived from the module registry the backend already
 * returns in `GET /management/me/permissions` — each row carries the `href` the
 * sidebar links to. Deriving the mapping from that data instead of a hand-kept
 * table means a module added in Management → Modules is gated the moment it is
 * seeded, with no frontend change.
 *
 * Scope: this is UX, not security. The API is the enforcement point
 * (`AdminAccessGuard` on the backend refuses anything the caller lacks a grant
 * for). These helpers exist so a restricted admin never lands on a page that
 * would only render a wall of 403s.
 */

export type RouteAccess =
  /** The path belongs to exactly one module. */
  | { kind: "module"; accessModule: EffectiveModule; allowed: boolean }
  /**
   * A hub path (e.g. `/unified-admin/settings`) that owns no data itself but
   * has modules nested underneath it. Readable when any child is.
   */
  | { kind: "hub"; children: EffectiveModule[]; allowed: boolean }
  /** No module claims this path — leave it to the API to decide. */
  | { kind: "unmapped"; allowed: true };

/**
 * Pages whose URL does not match any module's `href`.
 *
 * Kept deliberately tiny — every entry is a page that was folded into another
 * module's area but kept its old URL. Anything not listed here is resolved from
 * the registry, so a new module needs no entry.
 */
const PATH_MODULE_OVERRIDES: Record<string, string> = {
  // Availability flags moved under Settings → Security on 2026-08-07; the
  // `maintenance` module row was retired but the page kept its path.
  "/unified-admin/settings/maintenance": "security",
};

function isUnder(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function overrideFor(
  modules: EffectiveModule[],
  pathname: string,
): EffectiveModule | null {
  for (const [prefix, key] of Object.entries(PATH_MODULE_OVERRIDES)) {
    if (!isUnder(pathname, prefix)) continue;
    return modules.find((m) => m.key === key) ?? null;
  }
  return null;
}

/**
 * Which module governs `pathname`, and whether this admin may read it.
 *
 * Longest matching `href` wins, so `/unified-admin/settings/security` resolves
 * to `security` rather than to anything that happens to sit above it.
 */
export function resolveRouteAccess(
  modules: EffectiveModule[],
  pathname: string,
): RouteAccess {
  const overridden = overrideFor(modules, pathname);
  if (overridden) {
    return {
      kind: "module",
      accessModule: overridden,
      allowed: overridden.can_read,
    };
  }

  const matches = modules
    .filter((m) => m.href && isUnder(pathname, m.href))
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0));

  if (matches.length > 0) {
    const accessModule = matches[0];
    return { kind: "module", accessModule, allowed: accessModule.can_read };
  }

  const children = modules.filter((m) => m.href?.startsWith(`${pathname}/`));
  if (children.length > 0) {
    return {
      kind: "hub",
      children,
      allowed: children.some((m) => m.can_read),
    };
  }

  return { kind: "unmapped", allowed: true };
}

/** Convenience wrapper for the common "may I open this page?" question. */
export function canViewRoute(
  modules: EffectiveModule[],
  pathname: string,
): boolean {
  return resolveRouteAccess(modules, pathname).allowed;
}

/**
 * The first page this admin can actually open, in sidebar order.
 *
 * Parent rows carry no `href`, so they are skipped; a module whose href points
 * outside the unified panel (the analyst area) is still a valid landing spot.
 * Returns `null` when the account can read nothing at all — the caller decides
 * what to show, because "no modules" is a configuration problem, not a route.
 */
export function firstReadableHref(modules: EffectiveModule[]): string | null {
  const readable = [...modules]
    .filter((m) => m.can_read && m.href)
    .sort((a, b) => a.sort_order - b.sort_order);
  return readable[0]?.href ?? null;
}

/**
 * Where an admin should land after signing in, or after being bounced off a
 * page they cannot read.
 *
 * Prefers the panel's own default (`/unified-admin/dashboard`) when the account
 * can read it, so the common case is unchanged, and otherwise falls back to the
 * first module they can actually open.
 */
export function resolveLandingHref(
  permissions: Pick<MePermissions, "modules" | "is_super_admin"> | null,
  preferred: string,
): string | null {
  if (!permissions) return preferred;
  if (permissions.is_super_admin) return preferred;

  const modules = permissions.modules ?? [];
  if (modules.length === 0) return preferred;

  const preferredModule = modules.find(
    (m) => m.href && isUnder(preferred, m.href),
  );
  if (preferredModule?.can_read) return preferred;

  return firstReadableHref(modules);
}
