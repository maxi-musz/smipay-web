"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, LifeBuoy } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatDateTime,
} from "../../_components/Helpers";

export default function HandoffDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [data, setData] = useState<Awaited<
    ReturnType<typeof smileAiApi.handoffs.get>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { run } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await run(
          `smileai.handoffs.get:${id}`,
          () => smileAiApi.handoffs.get(id),
          { force },
        );
        setData(detail);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [id, run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Handoff detail"
        description={id}
        icon={<LifeBuoy className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={refresh} />

        {isLoading && !data ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="1rem" />
            <Skeleton height="6rem" />
          </Card>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="space-y-3 min-w-0">
              <Card className="p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                  Summary
                </h3>
                <p className="text-sm text-dashboard-heading whitespace-pre-wrap">
                  {data.summary}
                </p>
                {Object.keys(data.entities ?? {}).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-dashboard-border/40">
                    {Object.entries(data.entities ?? {}).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-dashboard-bg border border-dashboard-border/40"
                      >
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
                  Transcript snapshot
                </h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {Array.isArray(data.transcript) && data.transcript.length > 0 ? (
                    data.transcript.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            m.role === "user"
                              ? "bg-brand-bg-primary text-white"
                              : "bg-dashboard-bg text-dashboard-heading"
                          }`}
                        >
                          <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70 mb-0.5">
                            {m.role}
                          </p>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-dashboard-muted">
                      No transcript captured.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <aside className="space-y-3 min-w-0">
              <Card className="p-3 space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-1">
                  Links
                </h3>
                <Link
                  href={`/unified-admin/smileai/conversations/${data.conversation_id}`}
                  className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
                >
                  AI conversation
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                {(data.support_conversation as { id?: string } | null)?.id && (
                  <Link
                    href={`/unified-admin/support/conversations/${
                      (data.support_conversation as { id: string }).id
                    }`}
                    className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
                  >
                    Support thread
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </Card>
              <Card className="p-3 space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-1">
                  Trigger
                </h3>
                <p className="text-sm font-medium text-dashboard-heading">
                  {data.trigger.replace(/_/g, " ")}
                </p>
                <p className="text-[11px] text-dashboard-muted">
                  {formatDateTime(data.createdAt)}
                </p>
              </Card>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}
