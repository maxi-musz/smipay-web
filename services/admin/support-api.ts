import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  SupportListResponse,
  SupportDetailResponse,
  SupportMutationResponse,
  SupportFilters,
  AdminConversationsListResponse,
  AdminConversationDetailResponse,
  AdminConversationFilters,
} from "@/types/admin/support";

const BASE = "/unified-admin/support";

function buildParams(filters: Partial<SupportFilters>): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.support_type) params.support_type = filters.support_type;
  if (filters.assigned_to) params.assigned_to = filters.assigned_to;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  return params;
}

function buildConvParams(
  filters: Partial<AdminConversationFilters>,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.assigned_to) params.assigned_to = filters.assigned_to;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.has_ticket) params.has_ticket = filters.has_ticket;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  return params;
}

export const adminSupportApi = {
  // ─── Conversation endpoints ────────────────────────────────────────

  listConversations: async (
    filters: Partial<AdminConversationFilters>,
  ): Promise<AdminConversationsListResponse> => {
    try {
      const response = await backendApi.get<AdminConversationsListResponse>(
        `${BASE}/conversations`,
        { params: buildConvParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getConversation: async (id: string): Promise<AdminConversationDetailResponse> => {
    try {
      const response = await backendApi.get<AdminConversationDetailResponse>(
        `${BASE}/conversations/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  claimConversation: async (
    id: string,
  ): Promise<{ success: boolean; message: string; data: { conversation_id: string; assigned_to: string; assigned_admin_name: string } }> => {
    try {
      const response = await backendApi.post(`${BASE}/conversations/${id}/claim`);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  replyToConversation: async (
    id: string,
    payload: { message: string; is_internal?: boolean },
  ): Promise<{ success: boolean; message: string; data: { id: string; message: string; is_internal: boolean; is_from_user: boolean; sender_name: string; sender_email: string; createdAt: string } }> => {
    try {
      const response = await backendApi.post(
        `${BASE}/conversations/${id}/reply`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createTicketFromConversation: async (
    id: string,
    payload: {
      subject: string;
      description: string;
      support_type?: string;
      priority?: string;
      related_transaction_id?: string;
    },
  ): Promise<{ success: boolean; message: string; data: { ticket: { id: string; ticket_number: string; subject: string; support_type: string; priority: string; status: string; conversation_id: string } } }> => {
    try {
      const response = await backendApi.post(
        `${BASE}/conversations/${id}/create-ticket`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  closeConversation: async (
    id: string,
  ): Promise<{ success: boolean; message: string; data: { conversation_id: string } }> => {
    try {
      const response = await backendApi.post(`${BASE}/conversations/${id}/close`);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  initiateHandover: async (
    id: string,
    payload: { to_admin_id: string; reason?: string },
  ): Promise<{ success: boolean; message: string; data: { handover_id: string; conversation_id: string; to_admin_id: string; to_admin_name: string; status: string } }> => {
    try {
      const response = await backendApi.post(
        `${BASE}/conversations/${id}/handover`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  respondToHandover: async (
    handoverId: string,
    payload: { status: "accepted" | "rejected" },
  ): Promise<{ success: boolean; message: string; data: { handover_id: string; conversation_id: string; status: string } }> => {
    try {
      const response = await backendApi.post(
        `${BASE}/handovers/${handoverId}/respond`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  // ─── Ticket endpoints (existing — unchanged) ──────────────────────

  list: async (filters: Partial<SupportFilters>): Promise<SupportListResponse> => {
    try {
      const response = await backendApi.get<SupportListResponse>(BASE, {
        params: buildParams(filters),
      });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getById: async (id: string): Promise<SupportDetailResponse> => {
    try {
      const response = await backendApi.get<SupportDetailResponse>(
        `${BASE}/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  reply: async (
    id: string,
    payload: { message: string; is_internal?: boolean },
  ): Promise<SupportMutationResponse> => {
    try {
      const response = await backendApi.post<SupportMutationResponse>(
        `${BASE}/${id}/reply`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateStatus: async (
    id: string,
    payload: { status: string; resolution_notes?: string },
  ): Promise<SupportMutationResponse> => {
    try {
      const response = await backendApi.put<SupportMutationResponse>(
        `${BASE}/${id}/status`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  assign: async (
    id: string,
    payload: { assigned_to: string },
  ): Promise<SupportMutationResponse> => {
    try {
      const response = await backendApi.put<SupportMutationResponse>(
        `${BASE}/${id}/assign`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updatePriority: async (
    id: string,
    payload: { priority: string },
  ): Promise<SupportMutationResponse> => {
    try {
      const response = await backendApi.put<SupportMutationResponse>(
        `${BASE}/${id}/priority`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
