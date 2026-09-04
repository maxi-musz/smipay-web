import type { ApiResponse } from "@/types/admin/management";

export interface UserType {
  id: string;
  key: string;
  label: string;
  description: string | null;
  is_active: boolean;
  is_system: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserTypePayload {
  key: string;
  label: string;
  description?: string;
}

export type UpdateUserTypePayload = Partial<{
  label: string;
  description: string | null;
  is_active: boolean;
}>;

export type { ApiResponse };
