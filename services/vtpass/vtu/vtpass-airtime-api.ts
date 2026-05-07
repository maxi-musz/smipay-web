/**
 * VTPass Airtime API Service
 * Handles VTPass airtime purchase operations with proper error handling
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";

export interface VtpassService {
  serviceID: string;
  name: string;
  minimium_amount: string;
  maximum_amount: string;
  convinience_fee: string;
  product_type: string;
  image: string;
}

export interface VtpassPurchaseRequest {
  serviceID: string;
  amount: number;
  phone: string;
  request_id?: string;
  use_cashback?: boolean;
}

export interface VtpassTransactionContent {
  transactions: {
    status: "delivered" | "pending" | "initiated";
    product_name: string;
    unique_element: string;
    unit_price: string;
    quantity: number;
    amount: string;
    commission: number;
    total_amount: number;
    transactionId: string;
    commission_details: {
      amount: number;
      rate: string;
      rate_type: string;
      computation_type: string;
    };
  };
}

export interface VtpassPurchaseResponse {
  id: string;
  code: string;
  response_description: string;
  content?: VtpassTransactionContent;
  status?: "processing" | "success" | "failed";
  message?: string;
  requestId: string;
  amount: number;
  transaction_date?: string;
}

export interface VtpassServiceIdsResponse {
  success: boolean;
  message: string;
  data: VtpassService[];
}

export interface VtpassPurchaseApiResponse {
  success: boolean;
  message: string;
  data: VtpassPurchaseResponse;
}

export const vtpassAirtimeApi = {
  /**
   * Get available airtime service IDs
   * Retrieves list of available airtime providers and their service IDs
   */
  getServiceIds: async (): Promise<VtpassServiceIdsResponse> => {
    try {
      const response = await backendApi.get<VtpassServiceIdsResponse>(
        "/vtpass/airtime/service-ids"
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Purchase airtime
   * @param data - Purchase request data
   */
  purchaseAirtime: async (
    data: VtpassPurchaseRequest
  ): Promise<VtpassPurchaseApiResponse> => {
    try {
      const response = await backendApi.post<VtpassPurchaseApiResponse>(
        "/vtpass/airtime/purchase",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
