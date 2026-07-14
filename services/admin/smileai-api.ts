import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  ApiEnvelope,
  SmileAiAction,
  SmileAiActionExecution,
  SmileAiActionAnalyticsRow,
  SmileAiAdminNote,
  SmileAiChunk,
  SmileAiConversationDetail,
  SmileAiConversationListItem,
  SmileAiCostBreakdown,
  SmileAiCoverageGap,
  SmileAiDocStatus,
  SmileAiDocument,
  SmileAiFeedbackRow,
  SmileAiHandoffRow,
  SmileAiLimits,
  SmileAiLifecycle,
  SmileAiOverview,
  SmileAiPersona,
  SmileAiPersonaVersion,
  SmileAiProvider,
  SmileAiRetrievedHit,
  SmileAiSafety,
  SmileAiServicesResponse,
  SmileAiSettingsResponse,
  SmileAiSparkline,
  SmileAiVectorStore,
} from "@/types/admin/smileai";

const BASE = "/unified-admin/smileai";

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const res = await promise;
    if (!res.data?.success) {
      throw new Error(res.data?.message || "Request failed");
    }
    return res.data.data as T;
  } catch (err) {
    throw new Error(formatErrorMessage(err));
  }
}

export const smileAiApi = {
  // ─── Providers / vector stores ─────────────────────────────────────────
  providers: {
    list: (params: { kind?: "llm" | "embeddings"; include_archived?: boolean } = {}) =>
      unwrap<SmileAiProvider[]>(
        backendApi.get(`${BASE}/providers`, {
          params: {
            ...(params.kind ? { kind: params.kind } : {}),
            ...(params.include_archived ? { include_archived: "true" } : {}),
          },
        }),
      ),
    get: (id: string) =>
      unwrap<SmileAiProvider>(backendApi.get(`${BASE}/providers/${id}`)),
    create: (payload: Partial<SmileAiProvider> & {
      credentials?: Record<string, unknown>;
    }) =>
      unwrap<SmileAiProvider>(backendApi.post(`${BASE}/providers`, payload)),
    update: (id: string, payload: Partial<SmileAiProvider> & {
      credentials?: Record<string, unknown>;
    }) =>
      unwrap<SmileAiProvider>(backendApi.patch(`${BASE}/providers/${id}`, payload)),
    activate: (id: string) =>
      unwrap<SmileAiProvider>(backendApi.post(`${BASE}/providers/${id}/activate`)),
    archive: (id: string) =>
      unwrap<SmileAiProvider>(backendApi.delete(`${BASE}/providers/${id}`)),
    test: (kind: "llm" | "embeddings") =>
      backendApi
        .post(`${BASE}/providers/test`, undefined, { params: { kind } })
        .then((res) => res.data as ApiEnvelope<{ kind: string; sample?: string; dimensions?: number; latency_ms: number; tokens_in?: number; tokens_out?: number }>),
  },
  vectorStores: {
    list: (includeArchived = false) =>
      unwrap<SmileAiVectorStore[]>(
        backendApi.get(`${BASE}/vector-stores`, {
          params: includeArchived ? { include_archived: "true" } : undefined,
        }),
      ),
    get: (id: string) =>
      unwrap<SmileAiVectorStore>(backendApi.get(`${BASE}/vector-stores/${id}`)),
    create: (payload: Partial<SmileAiVectorStore> & {
      credentials?: Record<string, unknown>;
    }) =>
      unwrap<SmileAiVectorStore>(backendApi.post(`${BASE}/vector-stores`, payload)),
    update: (id: string, payload: Partial<SmileAiVectorStore> & {
      credentials?: Record<string, unknown>;
    }) =>
      unwrap<SmileAiVectorStore>(
        backendApi.patch(`${BASE}/vector-stores/${id}`, payload),
      ),
    activate: (id: string) =>
      unwrap<SmileAiVectorStore>(
        backendApi.post(`${BASE}/vector-stores/${id}/activate`),
      ),
    archive: (id: string) =>
      unwrap<SmileAiVectorStore>(backendApi.delete(`${BASE}/vector-stores/${id}`)),
    test: () =>
      backendApi
        .post(`${BASE}/vector-stores/test`)
        .then(
          (res) =>
            res.data as ApiEnvelope<{ id: string; latency_ms: number }>,
        ),
  },

  // ─── Personas ──────────────────────────────────────────────────────────
  personas: {
    list: (includeArchived = false) =>
      unwrap<SmileAiPersona[]>(
        backendApi.get(`${BASE}/personas`, {
          params: includeArchived ? { include_archived: "true" } : undefined,
        }),
      ),
    get: (id: string) =>
      unwrap<SmileAiPersona>(backendApi.get(`${BASE}/personas/${id}`)),
    create: (payload: {
      name: string;
      description?: string;
      system_prompt: string;
      capabilities?: Record<string, unknown>;
      is_active?: boolean;
    }) => unwrap<SmileAiPersona>(backendApi.post(`${BASE}/personas`, payload)),
    update: (
      id: string,
      payload: Partial<{
        name: string;
        description: string;
        system_prompt: string;
        prompt_version: number;
        capabilities: Record<string, unknown>;
        is_active: boolean;
      }>,
    ) => unwrap<SmileAiPersona>(backendApi.patch(`${BASE}/personas/${id}`, payload)),
    activate: (id: string) =>
      unwrap<SmileAiPersona>(backendApi.post(`${BASE}/personas/${id}/activate`)),
    archive: (id: string) =>
      unwrap<SmileAiPersona>(backendApi.delete(`${BASE}/personas/${id}`)),
    listVersions: (id: string) =>
      unwrap<{
        persona_id: string;
        active_version: number;
        items: SmileAiPersonaVersion[];
      }>(backendApi.get(`${BASE}/personas/${id}/versions`)),
    rollback: (id: string, version: number) =>
      unwrap<SmileAiPersona>(
        backendApi.post(`${BASE}/personas/${id}/versions/${version}/rollback`),
      ),
    listApprovals: () =>
      unwrap<{ items: Array<Record<string, unknown>> }>(
        backendApi.get(`${BASE}/personas/approvals/pending`),
      ),
    approveApproval: (approvalId: string) =>
      unwrap<{ persona_id: string }>(
        backendApi.post(`${BASE}/personas/approvals/${approvalId}/approve`),
      ),
    rejectApproval: (approvalId: string, note?: string) =>
      unwrap<{ id: string }>(
        backendApi.post(`${BASE}/personas/approvals/${approvalId}/reject`, { note }),
      ),
  },

  // ─── Knowledge base ────────────────────────────────────────────────────
  kb: {
    list: (params: {
      status?: SmileAiDocStatus;
      q?: string;
      limit?: number;
      offset?: number;
    } = {}) =>
      unwrap<{
        items: SmileAiDocument[];
        total: number;
        limit: number;
        offset: number;
      }>(backendApi.get(`${BASE}/kb/documents`, { params })),
    get: (id: string) =>
      unwrap<SmileAiDocument & { chunk_count: number }>(
        backendApi.get(`${BASE}/kb/documents/${id}`),
      ),
    chunks: (id: string, params: { limit?: number; offset?: number } = {}) =>
      unwrap<{
        items: SmileAiChunk[];
        total: number;
        limit: number;
        offset: number;
      }>(backendApi.get(`${BASE}/kb/documents/${id}/chunks`, { params })),
    upload: async (file: File, opts: { title?: string; tags?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (opts.title) form.append("title", opts.title);
      if (opts.tags) form.append("tags", opts.tags);
      const res = await backendApi.post(`${BASE}/kb/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as ApiEnvelope<{
        document_id: string;
        chunks: number;
        reused: boolean;
        status: SmileAiDocStatus;
      }>;
    },
    reindex: (id: string) =>
      unwrap<{ chunks: number; status: SmileAiDocStatus }>(
        backendApi.post(`${BASE}/kb/documents/${id}/reindex`),
      ),
    archive: (id: string) =>
      unwrap<SmileAiDocument>(
        backendApi.delete(`${BASE}/kb/documents/${id}`),
      ),
    testQuery: (payload: {
      query: string;
      top_k?: number;
      min_score?: number;
      filter?: {
        audience?: string;
        internal?: boolean;
        slug_in?: string[];
        tags_in?: string[];
      };
    }) =>
      unwrap<{ hits: SmileAiRetrievedHit[] }>(
        backendApi.post(`${BASE}/kb/test-query`, payload),
      ),
  },

  // ─── Actions ───────────────────────────────────────────────────────────
  actions: {
    list: (includeArchived = false) =>
      unwrap<{ items: SmileAiAction[] }>(
        backendApi.get(`${BASE}/actions`, {
          params: includeArchived ? { include_archived: "true" } : undefined,
        }),
      ).then((d) => d.items),
    get: (id: string) =>
      unwrap<SmileAiAction>(backendApi.get(`${BASE}/actions/${id}`)),
    create: (payload: Partial<SmileAiAction>) =>
      unwrap<SmileAiAction>(backendApi.post(`${BASE}/actions`, payload)),
    update: (id: string, payload: Partial<SmileAiAction>) =>
      unwrap<SmileAiAction>(backendApi.patch(`${BASE}/actions/${id}`, payload)),
    enable: (id: string) =>
      unwrap<SmileAiAction>(backendApi.post(`${BASE}/actions/${id}/enable`)),
    disable: (id: string) =>
      unwrap<SmileAiAction>(backendApi.post(`${BASE}/actions/${id}/disable`)),
    tryIt: (
      id: string,
      payload: { args?: Record<string, unknown>; as_user_id?: string },
    ) => backendApi
      .post(`${BASE}/actions/${id}/try`, payload)
      .then((res) => res.data as ApiEnvelope<unknown>),
    executions: (id: string, params: { limit?: number; offset?: number } = {}) =>
      unwrap<{
        items: SmileAiActionExecution[];
        total: number;
        limit: number;
        offset: number;
      }>(backendApi.get(`${BASE}/actions/${id}/executions`, { params })),
    listApprovals: () =>
      unwrap<{ items: Array<Record<string, unknown>> }>(
        backendApi.get(`${BASE}/actions/approvals/pending`),
      ),
    approveApproval: (id: string) =>
      unwrap<{ id: string }>(
        backendApi.post(`${BASE}/actions/approvals/${id}/approve`),
      ),
    rejectApproval: (id: string, note?: string) =>
      unwrap<{ id: string }>(
        backendApi.post(`${BASE}/actions/approvals/${id}/reject`, { note }),
      ),
  },

  // ─── Conversations ─────────────────────────────────────────────────────
  conversations: {
    list: (params: {
      status?: string;
      bucket?: "active" | "handed_off" | "closed";
      trigger?: string;
      q?: string;
      user_id?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {}) =>
      unwrap<{
        items: SmileAiConversationListItem[];
        total: number;
        by_status: Record<string, number>;
        buckets: { active: number; handed_off: number; closed: number };
        total_all: number;
        limit: number;
        offset: number;
      }>(backendApi.get(`${BASE}/conversations`, { params })),
    get: (id: string) =>
      unwrap<SmileAiConversationDetail>(
        backendApi.get(`${BASE}/conversations/${id}`),
      ),
    takeover: (id: string, reason?: string) =>
      unwrap<{ support_conversation_id?: string }>(
        backendApi.post(`${BASE}/conversations/${id}/takeover`, { reason }),
      ),
    addNote: (id: string, body: string) =>
      unwrap<SmileAiAdminNote>(
        backendApi.post(`${BASE}/conversations/${id}/notes`, { body }),
      ),
    listNotes: (id: string) =>
      unwrap<{ items: SmileAiAdminNote[] }>(
        backendApi.get(`${BASE}/conversations/${id}/notes`),
      ),
  },

  // ─── Handoffs ──────────────────────────────────────────────────────────
  handoffs: {
    list: (params: {
      trigger?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {}) =>
      unwrap<{
        items: SmileAiHandoffRow[];
        total: number;
        limit: number;
        offset: number;
      }>(backendApi.get(`${BASE}/handoffs`, { params })),
    get: (id: string) =>
      unwrap<{
        id: string;
        conversation_id: string;
        conversation: unknown;
        user: unknown;
        trigger: string;
        summary: string;
        entities: Record<string, unknown>;
        transcript: Array<{ role: string; content: string }>;
        support_conversation: unknown;
        createdAt: string;
      }>(backendApi.get(`${BASE}/handoffs/${id}`)),
  },

  // ─── Feedback ──────────────────────────────────────────────────────────
  feedback: {
    list: (params: {
      kind?: string;
      min_rating?: number;
      max_rating?: number;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {}) =>
      unwrap<{
        items: SmileAiFeedbackRow[];
        total: number;
        limit: number;
        offset: number;
      }>(backendApi.get(`${BASE}/feedback`, { params })),
  },

  // ─── Analytics ─────────────────────────────────────────────────────────
  analytics: {
    overview: (range: "24h" | "7d" | "30d" = "7d") =>
      unwrap<SmileAiOverview>(
        backendApi.get(`${BASE}/analytics/overview`, { params: { range } }),
      ),
    sparkline: (
      metric: "conversations" | "handoffs" | "cost_usd" | "tokens",
      range: "7d" | "30d" = "7d",
    ) =>
      unwrap<SmileAiSparkline>(
        backendApi.get(`${BASE}/analytics/sparkline`, {
          params: { metric, range },
        }),
      ),
    cost: (range: "7d" | "30d" = "7d") =>
      unwrap<SmileAiCostBreakdown>(
        backendApi.get(`${BASE}/analytics/cost`, { params: { range } }),
      ),
    actions: (range: "24h" | "7d" = "7d") =>
      unwrap<{
        range: string;
        items: SmileAiActionAnalyticsRow[];
      }>(backendApi.get(`${BASE}/analytics/actions`, { params: { range } })),
    coverageGaps: (limit = 20) =>
      unwrap<{
        items: SmileAiCoverageGap[];
        sampled: number;
      }>(backendApi.get(`${BASE}/analytics/coverage-gaps`, { params: { limit } })),
  },

  // ─── Settings ──────────────────────────────────────────────────────────
  settings: {
    listKeys: () =>
      unwrap<{
        items: Array<{
          key: string;
          updatedAt: string;
          updated_by: string | null;
          notes: string | null;
        }>;
      }>(backendApi.get(`${BASE}/settings`)),
    getLimits: () =>
      unwrap<SmileAiSettingsResponse<SmileAiLimits>>(
        backendApi.get(`${BASE}/settings/limits`),
      ),
    setLimits: (payload: Partial<SmileAiLimits> & { notes?: string }) =>
      unwrap<SmileAiSettingsResponse<SmileAiLimits>>(
        backendApi.patch(`${BASE}/settings/limits`, payload),
      ),
    getSafety: () =>
      unwrap<SmileAiSettingsResponse<SmileAiSafety>>(
        backendApi.get(`${BASE}/settings/safety`),
      ),
    setSafety: (payload: Partial<SmileAiSafety> & { notes?: string }) =>
      unwrap<SmileAiSettingsResponse<SmileAiSafety>>(
        backendApi.patch(`${BASE}/settings/safety`, payload),
      ),
    getServices: () =>
      unwrap<SmileAiServicesResponse>(
        backendApi.get(`${BASE}/settings/services`),
      ),
    setServices: (payload: {
      availability: Record<string, boolean>;
      notes?: string;
    }) =>
      unwrap<SmileAiServicesResponse>(
        backendApi.patch(`${BASE}/settings/services`, payload),
      ),
    getLifecycle: () =>
      unwrap<SmileAiSettingsResponse<SmileAiLifecycle>>(
        backendApi.get(`${BASE}/settings/lifecycle`),
      ),
    setLifecycle: (payload: Partial<SmileAiLifecycle> & { notes?: string }) =>
      unwrap<SmileAiSettingsResponse<SmileAiLifecycle>>(
        backendApi.patch(`${BASE}/settings/lifecycle`, payload),
      ),
    previewNudgeEmail: (params?: {
      first_name?: string;
      close_after_nudge_minutes?: number;
      subject?: string;
      use_branded?: boolean;
      body_html?: string;
    }) =>
      unwrap<{
        subject: string;
        html: string;
        mode: "branded" | "custom";
        sample_first_name: string;
        close_after_nudge_minutes: number;
      }>(
        backendApi.get(`${BASE}/settings/lifecycle/nudge-email-preview`, {
          params: {
            first_name: params?.first_name,
            close_after_nudge_minutes: params?.close_after_nudge_minutes,
            subject: params?.subject,
            use_branded: params?.use_branded,
            body_html: params?.body_html,
          },
        }),
      ),
    getMode: () =>
      unwrap<{
        effective: "read_only" | "read_write" | "paused";
        admin_mode: "read_only" | "read_write";
        user_mode: "read_only" | "read_write";
        paused: boolean;
      }>(backendApi.get(`${BASE}/settings/mode`)),
    setMode: (admin_mode: "read_only" | "read_write") =>
      unwrap<{
        effective: "read_only" | "read_write" | "paused";
        admin_mode: "read_only" | "read_write";
        user_mode: "read_only" | "read_write";
        paused: boolean;
      }>(backendApi.patch(`${BASE}/settings/mode`, { admin_mode })),
  },
};

export { unwrap };
