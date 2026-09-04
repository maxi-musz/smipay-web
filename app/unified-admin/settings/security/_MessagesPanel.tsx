"use client";

import { MessageSquare, RotateCcw } from "lucide-react";
import type { UserMessageItem } from "@/types/admin/messages";

/**
 * Fill `{placeholders}` with sample values so the admin reads the real
 * sentence, not the template. Mirrors `renderMessage` on the backend.
 */
const SAMPLES: Record<string, string> = {
  retry_after: "2 minutes",
  minutes: "30",
  seconds: "45",
};

export function previewOf(template: string): string {
  return template
    .replace(/\{(\w+)\}/g, (_, name: string) => SAMPLES[name] ?? "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

/**
 * The messages for one tab. Every box is pre-filled with real copy — the
 * built-in default when nothing has been overridden — so an admin can read
 * through, decide it's fine, and change nothing.
 */
export function MessagesSection({
  items,
  draft,
  saved,
  maxLength,
  onChange,
  title = "Message shown to users",
  intro,
}: {
  items: UserMessageItem[];
  draft: Record<string, string>;
  saved: Record<string, string>;
  maxLength: number;
  onChange: (key: string, value: string) => void;
  title?: string;
  intro?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5">
      <div className="flex items-start gap-3 pb-3 mb-1 border-b border-dashboard-border/40">
        <div className="h-8 w-8 rounded-lg bg-dashboard-bg flex items-center justify-center shrink-0">
          <MessageSquare className="h-4 w-4 text-dashboard-heading" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dashboard-heading">{title}</p>
          <p className="text-xs text-dashboard-muted mt-0.5">
            {intro ??
              "Already filled in with sensible wording. Edit only what you don't like — clearing a box restores the built-in text."}
          </p>
        </div>
      </div>

      <div className="divide-y divide-dashboard-border/40">
        {items.map((item) => (
          <MessageRow
            key={item.key}
            item={item}
            value={draft[item.key] ?? item.message}
            savedValue={saved[item.key] ?? item.message}
            maxLength={maxLength}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function MessageRow({
  item,
  value,
  savedValue,
  maxLength,
  onChange,
}: {
  item: UserMessageItem;
  value: string;
  savedValue: string;
  maxLength: number;
  onChange: (key: string, value: string) => void;
}) {
  const changed = value !== savedValue;
  const isDefault = value.trim() === item.default.trim();
  const tooLong = value.length > maxLength;

  return (
    <div className="py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="text-sm font-medium text-dashboard-heading">
              {item.label}
            </label>
            {changed && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                Changed
              </span>
            )}
            {!changed && item.overridden && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                Custom
              </span>
            )}
          </div>
          <p className="text-xs text-dashboard-muted mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(item.key, item.default)}
            className="text-[11px] text-dashboard-muted hover:text-dashboard-heading underline shrink-0 inline-flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Use default
          </button>
        )}
      </div>

      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(item.key, e.target.value)}
        className={`w-full text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 ${
          tooLong
            ? "border-red-300 focus:ring-red-200"
            : "border-dashboard-border/60 focus:ring-orange-200"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] text-dashboard-muted min-w-0">
          {item.placeholders.length > 0 && (
            <>
              Users will see:{" "}
              <span className="italic text-dashboard-heading">
                “{previewOf(value)}”
              </span>
            </>
          )}
        </p>
        <span
          className={`text-[11px] shrink-0 tabular-nums ${
            tooLong ? "text-red-600 font-semibold" : "text-dashboard-muted"
          }`}
        >
          {value.length}/{maxLength}
        </span>
      </div>

      {item.placeholders.length > 0 && (
        <p className="text-[11px] text-dashboard-muted">
          Available placeholders:{" "}
          {item.placeholders.map((p) => (
            <code
              key={p}
              className="font-mono bg-dashboard-bg px-1 py-0.5 rounded mr-1"
            >
              {`{${p}}`}
            </code>
          ))}
        </p>
      )}
    </div>
  );
}
