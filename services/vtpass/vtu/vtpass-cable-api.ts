/**
 * VTPass Cable TV API Service
 * Handles VTPass cable TV operations with proper error handling
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  VtpassCableServiceIdsResponse,
  VtpassCableVariationCodesResponse,
  VtpassCableVerifyRequest,
  VtpassCableVerifyResponse,
  VtpassCablePurchaseRequest,
  VtpassCablePurchaseApiResponse,
  VtpassCableQueryRequest,
  VtpassCableQueryResponse,
} from "@/types/vtpass/vtu/vtpass-cable";

export const vtpassCableApi = {
  getServiceIds: async (): Promise<VtpassCableServiceIdsResponse> => {
    try {
      const response = await backendApi.get<VtpassCableServiceIdsResponse>(
        "/vtpass/cable/service-ids"
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getVariationCodes: async (
    serviceID: string
  ): Promise<VtpassCableVariationCodesResponse> => {
    try {
      const response = await backendApi.get<VtpassCableVariationCodesResponse>(
        `/vtpass/cable/variation-codes?serviceID=${encodeURIComponent(serviceID)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  verifySmartcard: async (
    data: VtpassCableVerifyRequest
  ): Promise<VtpassCableVerifyResponse> => {
    try {
      const response = await backendApi.post<VtpassCableVerifyResponse>(
        "/vtpass/cable/verify",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  purchaseCable: async (
    data: VtpassCablePurchaseRequest
  ): Promise<VtpassCablePurchaseApiResponse> => {
    try {
      const response = await backendApi.post<VtpassCablePurchaseApiResponse>(
        "/vtpass/cable/purchase",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  queryTransaction: async (
    data: VtpassCableQueryRequest
  ): Promise<VtpassCableQueryResponse> => {
    try {
      const response = await backendApi.post<VtpassCableQueryResponse>(
        "/vtpass/cable/query",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
