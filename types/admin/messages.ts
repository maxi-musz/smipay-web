// --- User-facing messages ---
//
// The copy a user sees when a security rule stops them. Every message has a
// plain-English default written in code; a row only exists once an admin has
// changed one. Clearing a message restores its default.

export interface UserMessageItem {
  key: string;
  label: string;
  description: string;
  /** Policy group key ("device", "otp", …) or "rate_limit". */
  group: string;
  placeholders: string[];
  /** The built-in copy — what an empty override falls back to. */
  default: string;
  /** Effective copy: override if set, else the default. */
  message: string;
  overridden: boolean;
  /** `message` with sample placeholder values filled in. */
  preview: string;
  updatedAt: string | null;
  updated_by: string | null;
}

/** Optional per-endpoint override of the shared rate-limit message. */
export interface RateLimitMessageOverride {
  key: string;
  rule_key: string;
  label: string;
  endpoint: string;
  /** Empty string = no override, the shared default applies. */
  message: string;
  overridden: boolean;
}

export interface MessagesResponse {
  success: boolean;
  message: string;
  data: {
    items: UserMessageItem[];
    rate_limit_overrides: RateLimitMessageOverride[];
    max_length: number;
  };
}
