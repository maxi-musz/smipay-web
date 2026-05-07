/**
 * Wallet API Service
 * Handles wallet-related API calls with proper error handling
 */

import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";

// Types for Paystack funding
interface InitializePaystackFundingPayload {
  callback_url: string;
  amount: number;
}

interface InitializePaystackFundingResponse {
  success: boolean;
  message: string;
  data: {
    authorization_url: string;
    reference: string;
    amount: number;
    email: string;
  } | null;
}

interface VerifyPaystackFundingPayload {
  reference: string;
}

interface VerifyPaystackFundingResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    id?: string;
    amount?: string;
    transaction_type?: string;
    credit_debit?: string;
    description?: string;
    payment_method?: string;
    date?: string;
    balance_after?: string;
  } | null;
}

interface CancelPaystackFundingResponse {
  success: boolean;
  message: string;
}

export const walletApi = {
  /**
   * Get wallet balance and details
   */
  getWallet: async () => {
    try {
      const response = await backendApi.get("/wallet");
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Fund wallet
   * @param amount - Amount to fund
   * @param paymentMethod - Payment method (card, transfer, etc.)
   */
  fundWallet: async (amount: number, paymentMethod: string) => {
    try {
      const response = await backendApi.post("/wallet/fund", {
        amount,
        paymentMethod,
      });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Withdraw from wallet
   * @param amount - Amount to withdraw
   * @param bankDetails - Bank account details
   */
  withdrawFromWallet: async (
    amount: number,
    bankDetails: {
      accountNumber: string;
      bankCode: string;
    }
  ) => {
    try {
      const response = await backendApi.post("/wallet/withdraw", {
        amount,
        ...bankDetails,
      });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Get wallet transaction history
   * @param page - Page number
   * @param limit - Items per page
   */
  getTransactions: async (page: number = 1, limit: number = 20) => {
    try {
      const response = await backendApi.get("/wallet/transactions", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Get single transaction details
   * @param transactionId - Transaction ID
   */
  getTransactionById: async (transactionId: string) => {
    try {
      const response = await backendApi.get(`/wallet/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Initialize Paystack funding
   * @param callbackUrl - URL to redirect after payment
   * @param amount - Amount in Naira
   */
  initializePaystackFunding: async (
    callbackUrl: string,
    amount: number
  ): Promise<InitializePaystackFundingResponse> => {
    try {
      const payload: InitializePaystackFundingPayload = {
        callback_url: callbackUrl,
        amount,
      };
      const response = await backendApi.post<InitializePaystackFundingResponse>(
        "/banking/initialise-paystack-funding",
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Verify Paystack funding
   * @param reference - Transaction reference from Paystack
   */
  verifyPaystackFunding: async (
    reference: string
  ): Promise<VerifyPaystackFundingResponse> => {
    try {
      const payload: VerifyPaystackFundingPayload = {
        reference,
      };
      const response = await backendApi.post<VerifyPaystackFundingResponse>(
        "/banking/verify-paystack-funding",
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /**
   * Cancel a pending Paystack funding transaction.
   * Called when user explicitly cancels or abandons a payment.
   * @param reference - Transaction reference from Paystack
   */
  cancelPaystackFunding: async (
    reference: string
  ): Promise<CancelPaystackFundingResponse> => {
    try {
      const response = await backendApi.post<CancelPaystackFundingResponse>(
        "/banking/cancel-paystack-funding",
        { reference }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
