import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type { AdminUser, ApiResponse } from "@/types/admin/management";
import type {
  CreateUserTypePayload,
  UpdateUserTypePayload,
  UserType,
} from "@/types/admin/user-types";

const BASE = "/unified-admin/user-types";

async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  try {
    const res = await p;
    return res.data;
  } catch (error) {
    throw new Error(formatErrorMessage(error));
  }
}

export const adminUserTypesApi = {
  list: () => unwrap<ApiResponse<UserType[]>>(backendApi.get(BASE)),
  create: (payload: CreateUserTypePayload) =>
    unwrap<ApiResponse<UserType>>(backendApi.post(BASE, payload)),
  update: (key: string, payload: UpdateUserTypePayload) =>
    unwrap<ApiResponse<UserType>>(
      backendApi.put(`${BASE}/${encodeURIComponent(key)}`, payload),
    ),
  remove: (key: string) =>
    unwrap<ApiResponse<null>>(
      backendApi.delete(`${BASE}/${encodeURIComponent(key)}`),
    ),
  assign: (userId: string, user_types: string[]) =>
    unwrap<ApiResponse<AdminUser>>(
      backendApi.put(`${BASE}/assign/${encodeURIComponent(userId)}`, {
        user_types,
      }),
    ),
};
