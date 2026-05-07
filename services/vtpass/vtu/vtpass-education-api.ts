/**
 * VTPass Education API Service
 * Handles VTPass education operations (WAEC Registration, WAEC Result Checker, JAMB)
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  VtpassEducationVariationsResponse,
  VtpassEducationVerifyJambRequest,
  VtpassEducationVerifyJambResponse,
  VtpassEducationPurchaseRequest,
  VtpassEducationPurchaseApiResponse,
  VtpassEducationQueryRequest,
  VtpassEducationQueryResponse,
} from "@/types/vtpass/vtu/vtpass-education";

export const vtpassEducationApi = {
  getVariations: async (
    serviceID: string
  ): Promise<VtpassEducationVariationsResponse> => {
    try {
      const response = await backendApi.get<VtpassEducationVariationsResponse>(
        `/vtpass/education/variations?serviceID=${encodeURIComponent(serviceID)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  verifyJamb: async (
    data: VtpassEducationVerifyJambRequest
  ): Promise<VtpassEducationVerifyJambResponse> => {
    try {
      const response = await backendApi.post<VtpassEducationVerifyJambResponse>(
        "/vtpass/education/verify-jamb",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  purchase: async (
    data: VtpassEducationPurchaseRequest
  ): Promise<VtpassEducationPurchaseApiResponse> => {
    try {
      const response = await backendApi.post<VtpassEducationPurchaseApiResponse>(
        "/vtpass/education/purchase",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  queryTransaction: async (
    data: VtpassEducationQueryRequest
  ): Promise<VtpassEducationQueryResponse> => {
    try {
      const response = await backendApi.post<VtpassEducationQueryResponse>(
        "/vtpass/education/query",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
