import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  ActivityQuery,
  ActivityResponse,
  BacktestPayload,
  BacktestResponse,
  CreateEmailDomainRulePayload,
  CreateRulePayload,
  EmailDomainRuleRow,
  GuardField,
  GuardMode,
  GuardSurface,
  IdentityGuardConfigResponse,
  IdentityGuardRule,
  IdentityGuardsEnvelope,
  RestoreDefaultsResult,
  SimulatePayload,
  SimulateResponse,
  SurfaceMode,
  UpdateEmailDomainRulePayload,
  UpdateRulePayload,
} from "@/types/admin/identity-guards";

const BASE = "/unified-admin/identity-guards";

export class IdentityGuardsApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "IdentityGuardsApiError";
    this.status = status;
  }
}

function toApiError(error: unknown): IdentityGuardsApiError {
  const status = (error as { statusCode?: unknown } | null)?.statusCode;
  return new IdentityGuardsApiError(
    formatErrorMessage(error),
    typeof status === "number" && status > 0 ? status : null,
  );
}

async function call<T>(
  send: () => Promise<{ data: IdentityGuardsEnvelope<T> }>,
): Promise<T> {
  let body: IdentityGuardsEnvelope<T>;
  try {
    body = (await send()).data;
  } catch (error) {
    throw toApiError(error);
  }
  if (!body?.success || body.data === undefined) {
    throw new IdentityGuardsApiError(
      body?.message || "Unexpected response from the server.",
      null,
    );
  }
  return body.data;
}

const id = (value: string) => encodeURIComponent(value);

export const adminIdentityGuardsApi = {
  getConfig: () =>
    call(() =>
      backendApi.get<IdentityGuardsEnvelope<IdentityGuardConfigResponse>>(
        `${BASE}/config`,
      ),
    ),

  updateModes: (modes: Partial<Record<GuardField, GuardMode>>) =>
    call(() =>
      backendApi.put<IdentityGuardsEnvelope<IdentityGuardConfigResponse>>(
        `${BASE}/config`,
        { modes },
      ),
    ),

  updateSurfaces: (modes: Partial<Record<GuardSurface, SurfaceMode>>) =>
    call(() =>
      backendApi.put<IdentityGuardsEnvelope<IdentityGuardConfigResponse>>(
        `${BASE}/surfaces`,
        { modes },
      ),
    ),

  createRule: (payload: CreateRulePayload) =>
    call(() =>
      backendApi.post<IdentityGuardsEnvelope<IdentityGuardRule>>(
        `${BASE}/rules`,
        payload,
      ),
    ),

  updateRule: (ruleId: string, payload: UpdateRulePayload) =>
    call(() =>
      backendApi.put<IdentityGuardsEnvelope<IdentityGuardRule>>(
        `${BASE}/rules/${id(ruleId)}`,
        payload,
      ),
    ),

  deleteRule: (ruleId: string) =>
    call(() =>
      backendApi.delete<IdentityGuardsEnvelope<{ deleted: true }>>(
        `${BASE}/rules/${id(ruleId)}`,
      ),
    ),

  resetRule: (ruleId: string) =>
    call(() =>
      backendApi.post<IdentityGuardsEnvelope<IdentityGuardRule>>(
        `${BASE}/rules/${id(ruleId)}/reset`,
        {},
      ),
    ),

  restoreDefaults: (field?: GuardField) =>
    call(() =>
      backendApi.post<IdentityGuardsEnvelope<RestoreDefaultsResult>>(
        `${BASE}/rules/restore-defaults`,
        field ? { field } : {},
      ),
    ),

  simulate: (payload: SimulatePayload) =>
    call(() =>
      backendApi.post<IdentityGuardsEnvelope<SimulateResponse>>(
        `${BASE}/simulate`,
        payload,
      ),
    ),

  backtest: (payload: BacktestPayload) =>
    call(() =>
      backendApi.post<IdentityGuardsEnvelope<BacktestResponse>>(
        `${BASE}/backtest`,
        payload,
      ),
    ),

  getActivity: (query: ActivityQuery = {}) =>
    call(() =>
      backendApi.get<IdentityGuardsEnvelope<ActivityResponse>>(
        `${BASE}/activity`,
        {
          params: Object.fromEntries(
            Object.entries(query).filter(
              ([, v]) => v !== undefined && v !== "",
            ),
          ),
        },
      ),
    ),

  listEmailDomainRules: async (): Promise<EmailDomainRuleRow[]> => {
    const data = await call(() =>
      backendApi.get<IdentityGuardsEnvelope<{ rules: EmailDomainRuleRow[] }>>(
        `${BASE}/email-domain-rules`,
      ),
    );
    return data.rules;
  },

  createEmailDomainRule: (payload: CreateEmailDomainRulePayload) =>
    call(() =>
      backendApi.post<IdentityGuardsEnvelope<EmailDomainRuleRow>>(
        `${BASE}/email-domain-rules`,
        payload,
      ),
    ),

  updateEmailDomainRule: (
    ruleId: string,
    payload: UpdateEmailDomainRulePayload,
  ) =>
    call(() =>
      backendApi.put<IdentityGuardsEnvelope<EmailDomainRuleRow>>(
        `${BASE}/email-domain-rules/${id(ruleId)}`,
        payload,
      ),
    ),

  deleteEmailDomainRule: (ruleId: string) =>
    call(() =>
      backendApi.delete<IdentityGuardsEnvelope<{ deleted: true }>>(
        `${BASE}/email-domain-rules/${id(ruleId)}`,
      ),
    ),
};
