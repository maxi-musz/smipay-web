import type { MePermissions } from "@/types/admin/management";

export const SUPER_ADMIN_TYPE = "super-admin";
export const ANALYST_TYPE = "analyst";

export const SUPER_ADMIN_HOME = "/unified-admin/dashboard";
export const ANALYST_HOME = "/admin/analyst";

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
 * Post-login / entry redirect for back-office staff.
 * Uses capability tags from Management → User Types, not role alone.
 */
export function resolveAdminHomePath(
  permissions: Pick<MePermissions, "user_types"> | null | undefined,
): string {
  const types = permissions?.user_types ?? [];
  if (hasSuperAdminUserType(types)) return SUPER_ADMIN_HOME;
  if (hasAnalystUserType(types)) return ANALYST_HOME;
  // Legacy admins without tags — keep existing unified panel until typed.
  return SUPER_ADMIN_HOME;
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
  permissions: Pick<MePermissions, "user_types"> | null | undefined,
): Promise<string> {
  const home = resolveAdminHomePath(permissions);
  if (!callbackUrl?.startsWith("/")) return home;
  if (
    shouldBlockUnifiedAdminAccess(permissions?.user_types) &&
    callbackUrl.startsWith("/unified-admin")
  ) {
    return home;
  }
  return callbackUrl;
}
