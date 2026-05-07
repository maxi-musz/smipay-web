/**
 * VTPass Education API Types
 * Type definitions for VTPass education operations (WAEC, JAMB)
 */

export type EducationServiceID = "waec-registration" | "waec" | "jamb";

export interface VtpassEducationVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
}

export interface VtpassEducationVariationsResponse {
  success: boolean;
  message: string;
  data: {
    serviceName: string;
    serviceID: string;
    convenienceFee: string;
    variations: VtpassEducationVariation[];
  };
}

export interface VtpassEducationVerifyJambRequest {
  billersCode: string;
  type: string;
}

export interface VtpassEducationVerifyJambResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    content: {
      Customer_Name: string;
    };
  };
}

export interface VtpassEducationPurchaseRequest {
  serviceID: EducationServiceID;
  variation_code: string;
  phone: string;
  quantity?: number;
  billersCode?: string;
  amount?: number;
  request_id?: string;
  use_cashback?: boolean;
}

export interface VtpassEducationCard {
  Serial: string;
  Pin: string;
}

export interface VtpassEducationCredentials {
  tokens?: string[];
  cards?: VtpassEducationCard[];
  purchased_code?: string;
  pin?: string;
  serial?: string;
}

export interface VtpassEducationTransactionContent {
  transactions: {
    status: "delivered" | "pending" | "initiated" | "failed" | "reversed";
    product_name: string;
    unit_price: string | number;
    quantity: number;
    commission?: string | number;
    transactionId?: string;
  };
}

export interface VtpassEducationPurchaseResponse {
  id: string;
  code: string;
  response_description: string;
  requestId: string;
  amount: number;
  transaction_date?: string;
  purchased_code?: string;
  tokens?: string[];
  cards?: VtpassEducationCard[];
  Pin?: string;
  wallet_balance?: number;
  credentials: VtpassEducationCredentials;
  content?: VtpassEducationTransactionContent;
  status?: "processing" | "success" | "failed";
  message?: string;
}

export interface VtpassEducationPurchaseApiResponse {
  success: boolean;
  message: string;
  data: VtpassEducationPurchaseResponse;
}

export interface VtpassEducationQueryRequest {
  request_id: string;
}

export interface VtpassEducationQueryResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    response_description: string;
    content?: VtpassEducationTransactionContent;
    requestId?: string;
    amount?: number;
    transaction_date?: string;
    purchased_code?: string;
    tokens?: string[];
  };
}
