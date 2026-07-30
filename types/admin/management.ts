/** Types for the admin access-control (Management) module. */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export type AccessAction = "read" | "write" | "update" | "delete";

export interface Crud {
  can_read: boolean;
  can_write: boolean;
  can_update: boolean;
  can_delete: boolean;
}

/** A gate-able module / sidebar entry (registry row). */
export interface AccessModule {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  href: string | null;
  parent_key: string | null;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LevelGrant extends Crud {
  module_key: string;
}

export interface AccessLevel {
  level: number;
  name: string;
  description: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  /** This level's OWN grant delta (not the inherited/effective set). */
  grants: LevelGrant[];
}

/** Per-module breakdown used by the level editor. */
export interface LevelEffectiveModule {
  key: string;
  label: string;
  parent_key: string | null;
  is_active: boolean;
  sort_order: number;
  inherited: Crud;
  own: Crud;
  effective: Crud;
}

export interface LevelEffective {
  level: number;
  name: string;
  modules: LevelEffectiveModule[];
}

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
  permission_level: number;
  user_types: string[];
}

/** GET /me/permissions — drives the sidebar and client gating. */
export interface EffectiveModule extends Crud {
  key: string;
  label: string;
  icon: string | null;
  href: string | null;
  parent_key: string | null;
  sort_order: number;
}

export interface MePermissions {
  is_super_admin: boolean;
  permission_level: number;
  user_types: string[];
  modules: EffectiveModule[];
}

// ── Payloads ──────────────────────────────────────────────

export interface CreateModulePayload {
  key: string;
  label: string;
  icon?: string;
  href?: string;
  parent_key?: string;
  sort_order?: number;
  is_active?: boolean;
}

export type UpdateModulePayload = Partial<{
  label: string;
  icon: string | null;
  href: string | null;
  parent_key: string | null;
  sort_order: number;
  is_active: boolean;
}>;

export interface CreateLevelPayload {
  level: number;
  name: string;
  description?: string;
}

export type UpdateLevelPayload = Partial<{
  name: string;
  description: string | null;
  is_active: boolean;
}>;

export interface GrantItem extends Partial<Crud> {
  module_key: string;
}
