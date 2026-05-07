/**
 * VTPass Data API Types
 * Type definitions for VTPass data purchase operations
 */

export interface VtpassDataService {
  serviceID: string;
  name: string;
  minimium_amount: string;
  maximum_amount: string;
  convinience_fee: string;
  product_type: string;
  image: string;
}

export interface VtpassDataVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
  vtpass_amount: string;
  fixedPrice: string;
}

export interface VtpassDataVariationCategory {
  count: number;
  variations: VtpassDataVariation[];
}

export interface VtpassDataVariationCodesResponse {
  success: boolean;
  message: string;
  data: {
    ServiceName: string;
    serviceID: string;
    convinience_fee: string;
    counts: {
      All: number;
      Daily?: number;
      Weekly?: number;
      Monthly?: number;
      Night?: number;
      Weekend?: number;
      Social?: number;
      SME?: number;
      Hynetflex?: number;
      "Broadband router"?: number;
      Others?: number;
      total: number;
    };
    variations: VtpassDataVariation[];
    variations_categorized: Record<string, VtpassDataVariationCategory>;
  };
}

export interface VtpassDataPurchaseRequest {
  serviceID: string;
  billersCode: string;
  variation_code: string;
  amount?: number;
  phone?: string;
  request_id?: string;
  use_cashback?: boolean;
}

export interface VtpassDataTransactionContent {
  transactions: {
    status: "delivered" | "pending" | "initiated";
    product_name: string;
    unique_element: string;
    unit_price: string | number;
    quantity: number;
    amount: string | number;
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

export interface VtpassDataPurchaseResponse {
  id: string;
  code: string;
  response_description: string;
  content?: VtpassDataTransactionContent;
  status?: "processing" | "success" | "failed";
  message?: string;
  requestId: string;
  amount: number;
  transaction_date?: string;
}

export interface VtpassDataServiceIdsResponse {
  success: boolean;
  message: string;
  data: VtpassDataService[];
}

export interface VtpassDataPurchaseApiResponse {
  success: boolean;
  message: string;
  data: VtpassDataPurchaseResponse;
}
