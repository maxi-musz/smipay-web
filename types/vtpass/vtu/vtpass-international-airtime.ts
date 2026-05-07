/**
 * VTPass International Airtime Types
 * Covers countries, product types, operators, variations, purchase & query
 */

export interface IntlAirtimeCountry {
  code: string;
  flag: string;
  name: string;
  currency: string;
  prefix: string;
}

export interface IntlAirtimeCountriesResponse {
  success: boolean;
  message: string;
  data: {
    countries: IntlAirtimeCountry[];
  };
}

export interface IntlAirtimeProductType {
  product_type_id: number;
  name: string;
}

export interface IntlAirtimeProductTypesResponse {
  success: boolean;
  message: string;
  data: IntlAirtimeProductType[];
}

export interface IntlAirtimeOperator {
  operator_id: string;
  name: string;
  operator_image?: string;
}

export interface IntlAirtimeOperatorsResponse {
  success: boolean;
  message: string;
  data: IntlAirtimeOperator[];
}

export interface IntlAirtimeVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
}

export interface IntlAirtimeVariationsResponse {
  success: boolean;
  message: string;
  data: {
    serviceName: string;
    serviceID: string;
    convenienceFee: string;
    variations: IntlAirtimeVariation[];
  };
}

export interface IntlAirtimePurchaseRequest {
  serviceID?: string; // defaults to foreign-airtime on backend
  billersCode: string;
  variation_code: string;
  amount?: number;
  phone: string;
  operator_id: string;
  country_code: string;
  product_type_id: string;
  request_id?: string;
  use_cashback?: boolean;
}

export interface IntlAirtimeTransactionContent {
  transactions: {
    status: "delivered" | "pending" | "initiated" | "failed" | "reversed";
    product_name: string;
    unique_element: string;
    unit_price: string | number;
    quantity: number;
    commission: number;
    transactionId: string;
  };
}

export interface IntlAirtimePurchaseResponse {
  id?: string;
  code: string;
  response_description: string;
  requestId: string;
  amount?: number;
  transaction_date?: string;
  purchased_code?: string;
  content?: IntlAirtimeTransactionContent;
  wallet_balance?: number;
  status?: "processing" | "success" | "failed";
  message?: string;
}

export interface IntlAirtimePurchaseApiResponse {
  success: boolean;
  message: string;
  data: IntlAirtimePurchaseResponse;
}

export interface IntlAirtimeQueryRequest {
  request_id: string;
}

export interface IntlAirtimeQueryResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    response_description: string;
    content?: IntlAirtimeTransactionContent;
    requestId?: string;
    amount?: number;
    transaction_date?: string;
    purchased_code?: string;
  };
}

