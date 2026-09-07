import type { EffectiveModule, MePermissions } from "@/types/admin/management";

/**
 * Route ↔ module resolution, derived from the `href` on each module returned by
 * `GET /management/me/permissions` — so a newly seeded module is gated with no
 * frontend change.
 *
 * UX, not security: the API is the enforcement point. This just stops a
 * restricted admin landing on a page that would render a wall of 403s.
 */

export type RouteAccess =
  /** The path belongs to exactly one module. */
  | { kind: "module"; accessModule: EffectiveModule; allowed: boolean }
  /** A hub path (e.g. `/unified-admin/settings`) — readable if any child is. */
  | { kind: "hub"; children: EffectiveModule[]; allowed: boolean }
  /** No module claims this path — leave it to the API to decide. */
  | { kind: "unmapped"; allowed: true };

/** Pages folded into another module's area that kept their old URL. */
const PATH_MODULE_OVERRIDES: Record<string, string> = {
  // Retired `maintenance` module; page kept its path under Settings → Security.
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

/** Longest matching `href` wins. */
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

/** First openable page in sidebar order; null when nothing is readable. */
export function firstReadableHref(modules: EffectiveModule[]): string | null {
  const readable = [...modules]
    .filter((m) => m.can_read && m.href)
    .sort((a, b) => a.sort_order - b.sort_order);
  return readable[0]?.href ?? null;
}

/** `preferred` when readable, otherwise the first module they can open. */
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
