/**
 * VTPass Electricity API Service
 * Handles electricity bill payment operations with proper error handling
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  VtpassElectricityServiceIdsResponse,
  VtpassElectricityVerifyRequest,
  VtpassElectricityVerifyResponse,
  VtpassElectricityPurchaseRequest,
  VtpassElectricityPurchaseApiResponse,
  VtpassElectricityQueryRequest,
  VtpassElectricityQueryResponse,
} from "@/types/vtpass/vtu/vtpass-electricity";

export const vtpassElectricityApi = {
  getServiceIds: async (): Promise<VtpassElectricityServiceIdsResponse> => {
    try {
      const response = await backendApi.get<VtpassElectricityServiceIdsResponse>(
        "/vtpass/electricity/service-ids"
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  verifyMeter: async (
    data: VtpassElectricityVerifyRequest
  ): Promise<VtpassElectricityVerifyResponse> => {
    try {
      const response = await backendApi.post<VtpassElectricityVerifyResponse>(
        "/vtpass/electricity/verify",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  purchaseElectricity: async (
    data: VtpassElectricityPurchaseRequest
  ): Promise<VtpassElectricityPurchaseApiResponse> => {
    try {
      const response = await backendApi.post<VtpassElectricityPurchaseApiResponse>(
        "/vtpass/electricity/purchase",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  queryTransaction: async (
    data: VtpassElectricityQueryRequest
  ): Promise<VtpassElectricityQueryResponse> => {
    try {
      const response = await backendApi.post<VtpassElectricityQueryResponse>(
        "/vtpass/electricity/query",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
