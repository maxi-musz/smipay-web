/**
 * VTPass Electricity API Types
 * Type definitions for electricity bill payment operations
 */

export interface VtpassElectricityService {
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

export type MeterType = "prepaid" | "postpaid";

export interface VtpassElectricityServiceIdsResponse {
  success: boolean;
  message: string;
  data: VtpassElectricityService[];
}

// Verify Meter Types
export interface VtpassElectricityVerifyRequest {
  billersCode: string;
  serviceID: string;
  type: MeterType;
}

export interface VtpassElectricityVerifyContent {
  Customer_Name: string;
  Address?: string;
  Meter_Number?: string;
  Customer_Arrears?: string;
  Minimum_Amount?: string;
  Min_Purchase_Amount?: string;
  Can_Vend?: string;
  Business_Unit?: string;
  Customer_Account_Type?: string;
  Meter_Type?: string;
  WrongBillersCode?: boolean;
}

export interface VtpassElectricityVerifyResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    content: VtpassElectricityVerifyContent;
  };
}

// Purchase Types
export interface VtpassElectricityPurchaseRequest {
  serviceID: string;
  billersCode: string;
  variation_code: MeterType;
  amount: number;
  phone: string;
  request_id?: string;
  use_cashback?: boolean;
  customer_name?: string;
  customer_address?: string;
}

export interface VtpassElectricityTransactionContent {
  transactions: {
    status: "delivered" | "pending" | "initiated" | "failed" | "reversed";
    product_name: string;
    unique_element?: string;
    unit_price?: string | number;
    quantity?: number;
    amount?: string | number;
    commission?: number;
    total_amount?: number;
    transactionId?: string;
  };
}

export interface VtpassElectricityPurchaseResponse {
  id: string;
  code: string;
  response_description: string;
  requestId: string;
  amount: number;
  transaction_date?: string;
  purchased_code?: string;
  electricity_token?: string;
  token?: string;
  units?: string;
  customerName?: string;
  customerAddress?: string;
  wallet_balance?: number;
  content?: VtpassElectricityTransactionContent;
  status?: "processing" | "success" | "failed";
  message?: string;
}

export interface VtpassElectricityPurchaseApiResponse {
  success: boolean;
  message: string;
  data: VtpassElectricityPurchaseResponse;
}

// Query Transaction Types
export interface VtpassElectricityQueryRequest {
  request_id: string;
}

export interface VtpassElectricityQueryResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    response_description: string;
    content?: VtpassElectricityTransactionContent;
    requestId?: string;
    amount?: number;
    transaction_date?: string;
    purchased_code?: string;
    electricity_token?: string;
    units?: string;
  };
}
