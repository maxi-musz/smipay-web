import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  AccessLevel,
  AccessModule,
  AdminUser,
  ApiResponse,
  CreateLevelPayload,
  CreateModulePayload,
  GrantItem,
  LevelEffective,
  MePermissions,
  UpdateLevelPayload,
  UpdateModulePayload,
} from "@/types/admin/management";

const BASE = "/unified-admin/management";

async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  try {
    const res = await p;
    return res.data;
  } catch (error) {
    throw new Error(formatErrorMessage(error));
  }
}

export const adminManagementApi = {
  // Current admin
  getMyPermissions: () =>
    unwrap<ApiResponse<MePermissions>>(
      backendApi.get(`${BASE}/me/permissions`),
    ),

  // Modules registry
  listModules: () =>
    unwrap<ApiResponse<AccessModule[]>>(backendApi.get(`${BASE}/modules`)),
  createModule: (payload: CreateModulePayload) =>
    unwrap<ApiResponse<AccessModule>>(
      backendApi.post(`${BASE}/modules`, payload),
    ),
  updateModule: (key: string, payload: UpdateModulePayload) =>
    unwrap<ApiResponse<AccessModule>>(
      backendApi.put(`${BASE}/modules/${encodeURIComponent(key)}`, payload),
    ),
  deleteModule: (key: string) =>
    unwrap<ApiResponse<null>>(
      backendApi.delete(`${BASE}/modules/${encodeURIComponent(key)}`),
    ),

  // Levels + grants
  listLevels: () =>
    unwrap<ApiResponse<{ levels: AccessLevel[] }>>(
      backendApi.get(`${BASE}/levels`),
    ),
  createLevel: (payload: CreateLevelPayload) =>
    unwrap<ApiResponse<AccessLevel>>(backendApi.post(`${BASE}/levels`, payload)),
  updateLevel: (level: number, payload: UpdateLevelPayload) =>
    unwrap<ApiResponse<AccessLevel>>(
      backendApi.put(`${BASE}/levels/${level}`, payload),
    ),
  deleteLevel: (level: number) =>
    unwrap<ApiResponse<null>>(backendApi.delete(`${BASE}/levels/${level}`)),
  getLevelEffective: (level: number) =>
    unwrap<ApiResponse<LevelEffective>>(
      backendApi.get(`${BASE}/levels/${level}/effective`),
    ),
  setGrants: (level: number, grants: GrantItem[]) =>
    unwrap<ApiResponse<LevelEffective>>(
      backendApi.put(`${BASE}/levels/${level}/grants`, { grants }),
    ),

  // Admin users
  listAdmins: () =>
    unwrap<ApiResponse<AdminUser[]>>(backendApi.get(`${BASE}/admins`)),
  setAdminLevel: (userId: string, permission_level: number) =>
    unwrap<ApiResponse<AdminUser>>(
      backendApi.put(`${BASE}/admins/${encodeURIComponent(userId)}/level`, {
        permission_level,
      }),
    ),
};
