/**
 * VTPass International Airtime API Service
 * Handles countries, product types, operators, variations, purchase & query
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  IntlAirtimeCountriesResponse,
  IntlAirtimeProductTypesResponse,
  IntlAirtimeOperatorsResponse,
  IntlAirtimeVariationsResponse,
  IntlAirtimePurchaseRequest,
  IntlAirtimePurchaseApiResponse,
  IntlAirtimeQueryRequest,
  IntlAirtimeQueryResponse,
} from "@/types/vtpass/vtu/vtpass-international-airtime";

export const vtpassInternationalAirtimeApi = {
  getCountries: async (): Promise<IntlAirtimeCountriesResponse> => {
    try {
      const response = await backendApi.get<IntlAirtimeCountriesResponse>(
        "/vtpass/airtime/international/countries"
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getProductTypes: async (
    code: string
  ): Promise<IntlAirtimeProductTypesResponse> => {
    try {
      const response = await backendApi.get<IntlAirtimeProductTypesResponse>(
        `/vtpass/airtime/international/product-types`,
        { params: { code } }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getOperators: async (
    code: string,
    product_type_id: string | number
  ): Promise<IntlAirtimeOperatorsResponse> => {
    try {
      const response = await backendApi.get<IntlAirtimeOperatorsResponse>(
        `/vtpass/airtime/international/operators`,
        { params: { code, product_type_id } }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getVariations: async (
    operator_id: string,
    product_type_id: string | number
  ): Promise<IntlAirtimeVariationsResponse> => {
    try {
      const response = await backendApi.get<IntlAirtimeVariationsResponse>(
        `/vtpass/airtime/international/variations`,
        { params: { operator_id, product_type_id } }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  purchase: async (
    data: IntlAirtimePurchaseRequest
  ): Promise<IntlAirtimePurchaseApiResponse> => {
    try {
      const response = await backendApi.post<IntlAirtimePurchaseApiResponse>(
        "/vtpass/airtime/international/purchase",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  queryTransaction: async (
    data: IntlAirtimeQueryRequest
  ): Promise<IntlAirtimeQueryResponse> => {
    try {
      const response = await backendApi.post<IntlAirtimeQueryResponse>(
        "/vtpass/airtime/international/query",
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};

