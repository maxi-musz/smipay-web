/**
 * VTPass Cable TV API Types
 * Type definitions for VTPass cable TV operations
 */

export interface VtpassCableService {
  serviceID: string;
  name: string;
  identifier?: string;
  category?: string;
  commission?: string;
  minimum_amount?: string;
  maximum_amount?: string;
  minimium_amount?: string;
  maximium_amount?: string;
  convinience_fee?: string;
  product_type?: string;
  image?: string;
}

export interface VtpassCableVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
}

export interface VtpassCableVariationCodesResponse {
  success: boolean;
  message: string;
  data: {
    ServiceName: string;
    serviceID: string;
    convinience_fee: string;
    variations: VtpassCableVariation[];
    varations?: VtpassCableVariation[];
  };
}

export interface VtpassCableServiceIdsResponse {
  success: boolean;
  message: string;
  data: VtpassCableService[];
}

// Verify Smartcard Types
export interface VtpassCableVerifyRequest {
  billersCode: string;
  serviceID: string;
}

export interface VtpassCableVerifyContent {
  Customer_Name: string;
  Status?: string;
  Due_Date?: string;
  Customer_Number?: string;
  Customer_Type?: string;
  Current_Bouquet?: string;
  Renewal_Amount?: string;
  Balance?: number;
  Smartcard_Number?: string;
  commission_details?: {
    amount: number | null;
    rate: string;
    rate_type: string;
    computation_type: string;
  };
}

export interface VtpassCableVerifyResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    content: VtpassCableVerifyContent;
  };
}

// Purchase Types
export interface VtpassCablePurchaseRequest {
  request_id?: string;
  serviceID: string;
  billersCode: string;
  variation_code?: string;
  amount?: number;
  phone?: string;
  subscription_type?: "change" | "renew";
  quantity?: number;
  use_cashback?: boolean;
}

export interface VtpassCableTransactionContent {
  transactions: {
    status: "delivered" | "pending" | "initiated" | "failed" | "reversed";
    product_name: string;
    unique_element: string;
    unit_price: string | number;
    quantity: number;
    amount?: string | number;
    transactionId: string;
    commission?: number;
    total_amount?: number;
  };
}

export interface VtpassCablePurchaseResponse {
  id: string;
  code: string;
  response_description: string;
  content?: VtpassCableTransactionContent;
  status?: "processing" | "success" | "failed";
  message?: string;
  requestId: string;
  amount: number;
  transaction_date?: string;
  purchased_code?: string;
  Voucher?: string[];
  voucher_code?: string;
  voucher_codes?: string[];
}

export interface VtpassCablePurchaseApiResponse {
  success: boolean;
  message: string;
  data: VtpassCablePurchaseResponse;
}

// Query Transaction Types
export interface VtpassCableQueryRequest {
  request_id: string;
}

export interface VtpassCableQueryResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    response_description: string;
    content?: VtpassCableTransactionContent;
    requestId?: string;
    amount?: number;
    transaction_date?: string;
  };
}
