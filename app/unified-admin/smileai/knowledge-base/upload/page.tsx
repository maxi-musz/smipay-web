"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Upload, X } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import {
  Card,
  ErrorBanner,
  SectionHeader,
} from "../../_components/Helpers";

interface QueueItem {
  file: File;
  title: string;
  tags: string;
  status: "queued" | "uploading" | "indexed" | "reused" | "failed";
  message?: string;
  document_id?: string;
  chunks?: number;
}

export default function KbUploadPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { invalidatePrefix } = useAdminSmileAiCache();

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    setQueue((prev) => [
      ...prev,
      ...files.map((f) => ({
        file: f,
        title: f.name.replace(/\.[^.]+$/, ""),
        tags: "",
        status: "queued" as const,
      })),
    ]);
  }, []);

  const removeAt = (idx: number) =>
    setQueue((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, patch: Partial<QueueItem>) =>
    setQueue((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    );

  const uploadAll = async () => {
    setError(null);
    let touched = false;
    for (let i = 0; i < queue.length; i += 1) {
      const item = queue[i];
      if (item.status === "indexed" || item.status === "reused") continue;
      updateItem(i, { status: "uploading", message: undefined });
      try {
        const res = await smileAiApi.kb.upload(item.file, {
          title: item.title.trim() || undefined,
          tags: item.tags.trim() || undefined,
        });
        if (!res.success) {
          updateItem(i, { status: "failed", message: res.message });
          continue;
        }
        const data = res.data;
        if (data?.reused) {
          updateItem(i, {
            status: "reused",
            document_id: data.document_id,
            chunks: data.chunks,
            message: "Identical file already indexed",
          });
        } else {
          updateItem(i, {
            status: "indexed",
            document_id: data?.document_id,
            chunks: data?.chunks,
          });
        }
        touched = true;
      } catch (err) {
        updateItem(i, {
          status: "failed",
          message: (err as Error).message,
        });
      }
    }
    if (touched) {
      invalidatePrefix("smileai.kb");
      invalidatePrefix("smileai.analytics.coverage-gaps");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Upload Documents"
        description="Markdown and PDF supported. Each file becomes chunks the assistant can cite."
        icon={<Upload className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={uploadAll}
              disabled={queue.length === 0 || queue.every((q) => q.status === "indexed" || q.status === "reused")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <FileUp className="h-3.5 w-3.5" />
              Upload all ({queue.length})
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} />

        <Card className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? "border-orange-500 bg-orange-50"
                : "border-dashboard-border/80 hover:border-orange-400"
            }`}
          >
            <FileUp className="h-8 w-8 text-dashboard-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-dashboard-heading">
              Drop files here or
            </p>
            <label className="text-xs font-semibold text-orange-600 cursor-pointer hover:underline">
              browse
              <input
                type="file"
                multiple
                accept=".md,.markdown,.pdf,.txt,text/markdown,application/pdf,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="text-[11px] text-dashboard-muted mt-2">
              Max 25 MB per file
            </p>
          </div>
        </Card>

        {queue.length > 0 && (
          <Card className="overflow-hidden">
            <div className="px-3 py-2 border-b border-dashboard-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Upload queue
              </h3>
            </div>
            <div className="divide-y divide-dashboard-border/40">
              {queue.map((item, i) => (
                <div key={i} className="px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-dashboard-heading truncate">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-dashboard-muted">
                        {(item.file.size / 1024).toFixed(1)} KB ·{" "}
                        <StatusBadge status={item.status} />
                      </p>
                      {item.message && (
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          {item.message}
                        </p>
                      )}
                    </div>
                    {item.status === "queued" && (
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        className="p-1 text-dashboard-muted hover:text-rose-600"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {item.status === "queued" && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateItem(i, { title: e.target.value })
                        }
                        placeholder="Title (optional)"
                        className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5"
                      />
                      <input
                        type="text"
                        value={item.tags}
                        onChange={(e) =>
                          updateItem(i, { tags: e.target.value })
                        }
                        placeholder="Tags, comma-separated"
                        className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  )}
                  {item.document_id && (
                    <div className="mt-2 text-[11px] text-dashboard-muted">
                      <a
                        href={`/unified-admin/smileai/knowledge-base/${item.document_id}`}
                        className="text-orange-600 hover:underline"
                      >
                        Open document
                      </a>
                      {item.chunks !== undefined && (
                        <span className="ml-2">{item.chunks} chunks</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: QueueItem["status"] }) {
  const map: Record<QueueItem["status"], { label: string; tone: string }> = {
    queued: { label: "Queued", tone: "text-dashboard-muted" },
    uploading: { label: "Uploading…", tone: "text-amber-600" },
    indexed: { label: "Indexed", tone: "text-emerald-600" },
    reused: { label: "Already indexed", tone: "text-emerald-600" },
    failed: { label: "Failed", tone: "text-rose-600" },
  };
  const v = map[status];
  return (
    <span className={`inline-flex items-center gap-1 ${v.tone}`}>
      {status === "uploading" && <Loader2 className="h-3 w-3 animate-spin" />}
      {v.label}
    </span>
  );
}
