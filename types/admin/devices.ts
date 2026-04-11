export type DevicePlatform = "ios" | "android";
export type DeviceStatus = "active" | "restricted" | "inactive";

export interface DeviceUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  account_status: string;
  createdAt: string;
}

export interface AdminDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_fingerprint: string | null;
  device_name: string | null;
  device_model: string | null;
  platform: DevicePlatform;
  os_name: string | null;
  os_version: string | null;
  app_version: string | null;
  is_active: boolean;
  is_restricted: boolean;
  is_current_device: boolean;
  last_ip_address: string | null;
  last_location: string | null;
  first_seen_at: string;
  last_seen_at: string;
  restricted_at: string | null;
  restricted_by: string | null;
  createdAt: string;
  updatedAt: string;
  user: DeviceUser;
}

export interface AdminDeviceDetail extends AdminDevice {
  user: DeviceUser & {
    phone_number: string | null;
    deviceTokens: Array<{
      id: string;
      token: string;
      platform: DevicePlatform;
      is_active: boolean;
      app_version: string | null;
      updatedAt: string;
    }>;
  };
}

export interface DeviceStats {
  total: number;
  active: number;
  restricted: number;
  inactive: number;
  ios: number;
  android: number;
  unique_users: number;
  os_breakdown: Array<{ os: string; count: number }>;
}

export interface DeviceFilters {
  page: number;
  limit: number;
  platform: string;
  status: string;
  search: string;
  os_name: string;
  sort_by: string;
  sort_order: string;
}

export interface DeviceListResponse {
  success: boolean;
  message: string;
  data: {
    devices: AdminDevice[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface DeviceStatsResponse {
  success: boolean;
  message: string;
  data: DeviceStats;
}

export interface DeviceDetailResponse {
  success: boolean;
  message: string;
  data: AdminDeviceDetail;
}

export interface DeviceActionResponse {
  success: boolean;
  message: string;
  data: AdminDevice | { deleted: boolean } | { count: number };
}
