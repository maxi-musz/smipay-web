import type { MePermissions } from "@/types/admin/management";
import { resolveLandingHref } from "@/lib/admin-access";

export const SUPER_ADMIN_TYPE = "super-admin";
export const ANALYST_TYPE = "analyst";

export const SUPER_ADMIN_HOME = "/unified-admin/dashboard";
export const ANALYST_HOME = "/admin/analyst";

/** Shown when an account is signed in but has been granted no modules at all. */
export const NO_ACCESS_HOME = "/unified-admin/no-access";

export function hasSuperAdminUserType(
  userTypes: string[] | null | undefined,
): boolean {
  return (userTypes ?? []).includes(SUPER_ADMIN_TYPE);
}

export function hasAnalystUserType(
  userTypes: string[] | null | undefined,
): boolean {
  return (userTypes ?? []).includes(ANALYST_TYPE);
}

/** Analyst tag without super-admin — separate admin shell, not unified-admin. */
export function isAnalystOnlyAdmin(
  userTypes: string[] | null | undefined,
): boolean {
  return hasAnalystUserType(userTypes) && !hasSuperAdminUserType(userTypes);
}

/**
 * Post-login redirect. Capability tags pick the shell (analyst vs unified
 * panel); the module grants then pick the page.
 */
export function resolveAdminHomePath(
  permissions:
    | Pick<MePermissions, "user_types" | "modules" | "is_super_admin">
    | null
    | undefined,
): string {
  const types = permissions?.user_types ?? [];

  if (hasAnalystUserType(types) && !hasSuperAdminUserType(types)) {
    return ANALYST_HOME;
  }

  return (
    resolveLandingHref(permissions ?? null, SUPER_ADMIN_HOME) ?? NO_ACCESS_HOME
  );
}

export async function fetchAdminHomePath(): Promise<string> {
  const { adminManagementApi } = await import("@/services/admin/management-api");
  const { useAdminPermissionsStore } = await import(
    "@/store/admin/admin-permissions-store"
  );

  useAdminPermissionsStore.getState().invalidate();

  try {
    const res = await adminManagementApi.getMyPermissions();
    if (res.success && res.data) {
      useAdminPermissionsStore.setState({
        data: res.data,
        fetched: true,
        ts: Date.now(),
        error: null,
        loading: false,
      });
      return resolveAdminHomePath(res.data);
    }
  } catch {
    // Fall through to default.
  }
  return SUPER_ADMIN_HOME;
}

/** Block unified-admin URLs for analyst-only admins. */
export function shouldBlockUnifiedAdminAccess(
  userTypes: string[] | null | undefined,
): boolean {
  return isAnalystOnlyAdmin(userTypes);
}

export async function resolveStaffRedirect(
  callbackUrl: string | null | undefined,
  permissions:
    | Pick<MePermissions, "user_types" | "modules" | "is_super_admin">
    | null
    | undefined,
): Promise<string> {
  const home = resolveAdminHomePath(permissions);
  if (!callbackUrl?.startsWith("/")) return home;

  if (
    shouldBlockUnifiedAdminAccess(permissions?.user_types) &&
    callbackUrl.startsWith("/unified-admin")
  ) {
    return home;
  }

  // Only honour a callback the account can actually read.
  if (permissions && !permissions.is_super_admin) {
    const target = resolveLandingHref(permissions, callbackUrl);
    if (target !== callbackUrl) return home;
  }

  return callbackUrl;
}
