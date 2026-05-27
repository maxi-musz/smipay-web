"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Notebook,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type {
  SmileAiConversationDetail,
  SmileAiConversationMessage,
} from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  StatusPill,
  formatDateTime,
  formatNumber,
  formatRelative,
  formatUsd,
} from "../../_components/Helpers";

type View = "summary" | "transcript";

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [data, setData] = useState<SmileAiConversationDetail | null>(null);
  const [view, setView] = useState<View>("transcript");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [takeoverReason, setTakeoverReason] = useState("");
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [actionPending, setActionPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await smileAiApi.conversations.get(id);
      setData(detail);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleTakeover = async () => {
    setActionPending("takeover");
    try {
      await smileAiApi.conversations.takeover(id, takeoverReason);
      setShowTakeoverDialog(false);
      setTakeoverReason("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionPending(null);
    }
  };

  const handleAddNote = async () => {
    if (!noteDraft.trim()) return;
    setActionPending("note");
    try {
      await smileAiApi.conversations.addNote(id, noteDraft.trim());
      setNoteDraft("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title={data ? `Conversation ${id.slice(0, 8)}…` : "Conversation"}
        description={data?.user?.email ?? data?.user_email ?? id}
        icon={<MessageSquare className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            {data?.status !== "handed_off" && data?.status !== "closed" && (
              <button
                type="button"
                onClick={() => setShowTakeoverDialog(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Take over
              </button>
            )}
            <button
              type="button"
              onClick={load}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        {isLoading && !data ? (
          <Card className="p-4 space-y-3">
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
          </Card>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="min-w-0 space-y-3">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-dashboard-border/60">
                  <div className="flex items-center gap-1.5">
                    <ToggleButton
                      active={view === "summary"}
                      onClick={() => setView("summary")}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Summary
                    </ToggleButton>
                    <ToggleButton
                      active={view === "transcript"}
                      onClick={() => setView("transcript")}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Transcript
                    </ToggleButton>
                  </div>
                  <StatusPill status={data.status} />
                </div>
                <div className="p-3 max-h-[68vh] overflow-y-auto">
                  {view === "summary" ? (
                    <SummaryView data={data} />
                  ) : (
                    <TranscriptView messages={data.messages} />
                  )}
                </div>
              </Card>

              {data.executions.length > 0 && (
                <Card className="p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
                    Tool executions
                  </h3>
                  <div className="space-y-1.5">
                    {data.executions.slice(0, 10).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-dashboard-bg"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-dashboard-heading">
                            {e.action_name}
                          </p>
                          <p className="text-[11px] text-dashboard-muted">
                            {e.safety} · {formatRelative(e.createdAt)}
                          </p>
                        </div>
                        <StatusPill status={e.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <aside className="space-y-3 min-w-0">
              <Card className="p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
                  User
                </h3>
                {data.user ? (
                  <div className="space-y-1.5">
                    <Link
                      href={`/unified-admin/users/${data.user.id}`}
                      className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline"
                    >
                      {`${data.user.first_name ?? ""} ${data.user.last_name ?? ""}`.trim() ||
                        data.user.email ||
                        data.user.id}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <p className="text-xs text-dashboard-muted truncate">
                      {data.user.email}
                    </p>
                    {data.user.phone_number && (
                      <p className="text-xs text-dashboard-muted">
                        {data.user.phone_number}
                      </p>
                    )}
                    {data.user.smipay_tag && (
                      <p className="text-xs text-dashboard-muted">
                        @{data.user.smipay_tag}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-dashboard-muted">No user info</p>
                )}
              </Card>

              <Card className="p-3 space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-1">
                  Metadata
                </h3>
                <Row label="Persona" value={data.persona?.name ?? "—"} />
                <Row
                  label="Tokens in/out"
                  value={`${formatNumber(data.total_tokens_in)} / ${formatNumber(
                    data.total_tokens_out,
                  )}`}
                />
                <Row label="Cost" value={formatUsd(data.total_cost_usd)} />
                <Row label="IP" value={data.ip_address ?? "—"} />
                <Row label="Started" value={formatDateTime(data.createdAt)} />
                <Row
                  label="Last activity"
                  value={formatRelative(data.last_message_at)}
                />
                {data.support_conversation_id && (
                  <div className="pt-2 border-t border-dashboard-border/40">
                    <Link
                      href={`/unified-admin/support/conversations/${data.support_conversation_id}`}
                      className="text-xs font-medium text-orange-600 hover:underline inline-flex items-center gap-1"
                    >
                      Open support thread
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </Card>

              <Card className="p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2 flex items-center gap-1.5">
                  <Notebook className="h-3.5 w-3.5" />
                  Internal notes
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.notes.length === 0 && (
                    <p className="text-[11px] text-dashboard-muted">
                      No notes yet.
                    </p>
                  )}
                  {data.notes.map((n) => (
                    <div
                      key={n.id}
                      className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs"
                    >
                      <p className="text-amber-900 whitespace-pre-wrap break-words">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-1">
                        {n.author_name ?? n.author_id} ·{" "}
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-1.5">
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add internal note…"
                    className="w-full text-xs border border-dashboard-border/60 rounded-lg px-2 py-1.5 resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!noteDraft.trim() || actionPending === "note"}
                    className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Save note
                  </button>
                </div>
              </Card>
            </aside>
          </div>
        ) : null}
      </div>

      {showTakeoverDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl">
            <h2 className="text-base font-semibold text-dashboard-heading mb-1">
              Force handoff to support
            </h2>
            <p className="text-xs text-dashboard-muted mb-3">
              This will create a SupportConversation in the unassigned queue
              and stop the AI from responding. The user will be notified.
            </p>
            <textarea
              value={takeoverReason}
              onChange={(e) => setTakeoverReason(e.target.value)}
              placeholder="Reason (optional, internal)"
              className="w-full text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowTakeoverDialog(false)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTakeover}
                disabled={actionPending === "takeover"}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Take over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-brand-bg-primary text-white"
          : "text-dashboard-heading hover:bg-dashboard-bg"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-dashboard-muted">{label}</span>
      <span className="text-dashboard-heading font-medium text-right break-words max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function SummaryView({ data }: { data: SmileAiConversationDetail }) {
  const latestHandoff = data.handoffs[0];
  return (
    <div className="space-y-3">
      {latestHandoff ? (
        <div>
          <h4 className="text-xs font-semibold text-dashboard-heading mb-1">
            Latest handoff ({latestHandoff.trigger})
          </h4>
          <p className="text-sm text-dashboard-heading whitespace-pre-wrap">
            {latestHandoff.summary}
          </p>
          {Object.keys(latestHandoff.entities).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(latestHandoff.entities).map(([k, v]) => (
                <span
                  key={k}
                  className="px-2 py-0.5 text-[11px] bg-dashboard-bg rounded-full border border-dashboard-border/40"
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-dashboard-muted">
          No summary yet — this conversation has not triggered a handoff or
          rating. The full transcript is on the right tab.
        </p>
      )}

      <div>
        <h4 className="text-xs font-semibold text-dashboard-heading mb-1">
          Feedback
        </h4>
        {data.feedback.length === 0 ? (
          <p className="text-xs text-dashboard-muted">No feedback yet.</p>
        ) : (
          <div className="space-y-1">
            {data.feedback.map((f) => (
              <div
                key={f.id}
                className="text-xs flex items-center justify-between"
              >
                <span>
                  {f.kind}
                  {f.rating !== null && ` · ${f.rating}/5`}
                </span>
                <span className="text-dashboard-muted">
                  {formatRelative(f.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TranscriptView({
  messages,
}: {
  messages: SmileAiConversationMessage[];
}) {
  if (messages.length === 0) {
    return (
      <p className="text-xs text-dashboard-muted text-center py-4">
        No messages yet.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <MessageRow key={m.id} message={m} />
      ))}
    </div>
  );
}

function MessageRow({ message }: { message: SmileAiConversationMessage }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? "bg-brand-bg-primary text-white"
            : isTool
              ? "bg-amber-50 border border-amber-200 text-amber-900"
              : "bg-dashboard-bg text-dashboard-heading"
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
            {message.role}
          </span>
          {isTool && (
            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
              tool
            </span>
          )}
          <span className="text-[10px] opacity-60">
            {formatRelative(message.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {Array.isArray(message.citations) && message.citations.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(message.citations as Array<{ id?: string; title?: string }>).map(
              (c, i) => (
                <span
                  key={`${c.id ?? i}`}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-black/10"
                >
                  {c.title ?? `chunk ${c.id ?? i}`}
                </span>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
