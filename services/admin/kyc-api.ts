import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  KycOverviewResponse,
  CreateKycTierPayload,
  UpdateKycTierPayload,
  CreateTierPropertyPayload,
  UpdateTierPropertyPayload,
  TierPropertyAssignmentPayload,
  KycTier,
  TierPropertyDefinition,
} from "@/types/admin/kyc";

export const adminKycApi = {
  getOverview: async (): Promise<KycOverviewResponse> => {
    try {
      const response = await backendApi.get<KycOverviewResponse>(
        "/unified-admin/kyc",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createTier: async (
    payload: CreateKycTierPayload,
  ): Promise<{ success: boolean; message: string; data?: KycTier }> => {
    try {
      const response = await backendApi.post<{
        success: boolean;
        message: string;
        data?: KycTier;
      }>("/unified-admin/kyc/tiers", payload);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateTier: async (
    id: string,
    payload: UpdateKycTierPayload,
  ): Promise<{ success: boolean; message: string; data?: KycTier }> => {
    try {
      const response = await backendApi.patch<{
        success: boolean;
        message: string;
        data?: KycTier;
      }>(`/unified-admin/kyc/tiers/${id}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createProperty: async (
    payload: CreateTierPropertyPayload,
  ): Promise<{ success: boolean; message: string; data?: TierPropertyDefinition }> => {
    try {
      const response = await backendApi.post<{
        success: boolean;
        message: string;
        data?: TierPropertyDefinition;
      }>("/unified-admin/kyc/properties", payload);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateProperty: async (
    id: string,
    payload: UpdateTierPropertyPayload,
  ): Promise<{ success: boolean; message: string; data?: TierPropertyDefinition }> => {
    try {
      const response = await backendApi.patch<{
        success: boolean;
        message: string;
        data?: TierPropertyDefinition;
      }>(`/unified-admin/kyc/properties/${id}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  deleteProperty: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await backendApi.delete<{ success: boolean; message: string }>(
        `/unified-admin/kyc/properties/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  seedProperties: async (): Promise<{
    success: boolean;
    message: string;
    data?: { created: string[]; skipped: string[] };
  }> => {
    try {
      const response = await backendApi.post<{
        success: boolean;
        message: string;
        data?: { created: string[]; skipped: string[] };
      }>("/unified-admin/kyc/properties/seed");
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  setTierProperties: async (
    tierId: string,
    assignments: TierPropertyAssignmentPayload[],
  ): Promise<{ success: boolean; message: string; data?: KycTier }> => {
    try {
      const response = await backendApi.put<{
        success: boolean;
        message: string;
        data?: KycTier;
      }>(`/unified-admin/kyc/tiers/${tierId}/properties`, { assignments });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
