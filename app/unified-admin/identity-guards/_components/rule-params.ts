import type { ParamDescriptor } from "@/types/admin/identity-guards";

export type ParamDraft = Record<string, string | boolean>;

export const RAW_PARAMS_KEY = "__params_json__";

export const RAW_PARAMS_DESCRIPTOR: ParamDescriptor = {
  key: RAW_PARAMS_KEY,
  label: "Parameters (JSON)",
  help: "This rule type isn't described by the server, so its parameters are edited as raw JSON.",
  kind: "json",
  required: true,
};

export function toDraftValue(
  desc: ParamDescriptor,
  value: unknown,
): string | boolean {
  switch (desc.kind) {
    case "boolean":
      return value === true;
    case "string_list":
      return Array.isArray(value) ? value.map(String).join("\n") : "";
    case "json":
      return value === undefined ? "" : JSON.stringify(value, null, 2);
    case "number":
      return typeof value === "number" ? String(value) : "";
    case "enum":
      return typeof value === "string"
        ? value
        : (desc.options?.[0]?.value ?? "");
    default:
      return typeof value === "string"
        ? value
        : value === null || value === undefined
          ? ""
          : String(value);
  }
}

export function initialDraft(
  descriptors: ParamDescriptor[],
  params: Record<string, unknown>,
): ParamDraft {
  const draft: ParamDraft = {};
  for (const d of descriptors) {
    draft[d.key] =
      d.key === RAW_PARAMS_KEY
        ? JSON.stringify(params ?? {}, null, 2)
        : toDraftValue(d, params?.[d.key]);
  }
  return draft;
}

export type ParsedParams =
  | { ok: true; params: Record<string, unknown> }
  | { ok: false; errors: Record<string, string> };

export function parseParams(
  descriptors: ParamDescriptor[],
  draft: ParamDraft,
  base: Record<string, unknown>,
): ParsedParams {
  if (descriptors.some((d) => d.key === RAW_PARAMS_KEY)) {
    const raw = draft[RAW_PARAMS_KEY];
    try {
      const parsed: unknown = JSON.parse(
        typeof raw === "string" && raw.trim() ? raw : "{}",
      );
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ok: true, params: parsed as Record<string, unknown> };
      }
      return { ok: false, errors: { [RAW_PARAMS_KEY]: "Must be a JSON object." } };
    } catch {
      return { ok: false, errors: { [RAW_PARAMS_KEY]: "Not valid JSON." } };
    }
  }

  const params: Record<string, unknown> = { ...base };
  const errors: Record<string, string> = {};

  for (const d of descriptors) {
    const raw = draft[d.key];
    const text = typeof raw === "string" ? raw : "";

    switch (d.kind) {
      case "boolean":
        params[d.key] = raw === true;
        break;

      case "number": {
        const s = text.trim();
        if (!s) {
          if (d.required) errors[d.key] = "Required.";
          else delete params[d.key];
          break;
        }
        const n = Number(s);
        if (!Number.isFinite(n)) {
          errors[d.key] = "Enter a number.";
        } else if (typeof d.min === "number" && n < d.min) {
          errors[d.key] = `At least ${d.min}.`;
        } else if (typeof d.max === "number" && n > d.max) {
          errors[d.key] = `At most ${d.max}.`;
        } else {
          params[d.key] = n;
        }
        break;
      }

      case "string_list": {
        const list = Array.from(
          new Set(
            text
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean),
          ),
        );
        if (d.required && list.length === 0) errors[d.key] = "Add at least one entry.";
        else params[d.key] = list;
        break;
      }

      case "json": {
        const s = text.trim();
        if (!s) {
          if (d.required) errors[d.key] = "Required.";
          else delete params[d.key];
          break;
        }
        try {
          params[d.key] = JSON.parse(s) as unknown;
        } catch {
          errors[d.key] = "Not valid JSON.";
        }
        break;
      }

      case "enum":
        if (!text && d.required) errors[d.key] = "Pick one.";
        else params[d.key] = text;
        break;

      default: {
        // Strings are kept verbatim — a regex's spaces can matter.
        if (!text.trim()) {
          if (d.required) errors[d.key] = "Required.";
          else delete params[d.key];
        } else {
          params[d.key] = text;
        }
      }
    }
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, params };
}
