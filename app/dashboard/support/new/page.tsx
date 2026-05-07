"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { useVisualViewportHeight } from "@/hooks/useVisualViewportHeight";
import { supportApi } from "@/services/support-api";
import { useUserSupportStore } from "@/store/user-support-store";
import { getDeviceMetadataHeaders } from "@/lib/device-metadata";

export default function NewChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { invalidateList } = useUserSupportStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportHeight = useVisualViewportHeight();

  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 40), maxHeight)}px`;
  }, [inputValue]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const msg = inputValue.trim();
      if (!msg || sending) return;

      setSending(true);
      setError(null);

      try {
        let deviceMeta: { device_id?: string; device_model?: string; platform?: string; app_version?: string } | undefined;
        try {
          const headers = await getDeviceMetadataHeaders();
          if (headers["x-device-id"]) {
            deviceMeta = {
              device_id: headers["x-device-id"],
              device_model: headers["x-device-model"],
              platform: headers.platform,
              app_version: headers["x-app-version"],
            };
          }
        } catch {
          /* device metadata is optional */
        }
        const res = await supportApi.sendChat({
          message: msg,
          device_metadata: deviceMeta,
        });

        if (res.success && res.data) {
          invalidateList();
          if ("conversation" in res.data && res.data.conversation?.id) {
            router.replace(`/dashboard/support/${res.data.conversation.id}`);
          } else if ("conversation_id" in res.data) {
            router.replace(`/dashboard/support/${res.data.conversation_id}`);
          }
        } else {
          setError(res.message ?? "Failed to send message");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [inputValue, sending, invalidateList, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex flex-col overflow-hidden bg-dashboard-bg"
      style={{
        height: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
        minHeight: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
      }}
    >
      <header className="bg-dashboard-surface border-b border-dashboard-border shrink-0 z-10">
        <div className="flex items-center gap-2 px-3 py-3 sm:px-4 sm:py-4">
          <Link
            href="/dashboard/support"
            className="p-1.5 -m-1.5 rounded-lg hover:bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base sm:text-lg font-semibold text-dashboard-heading truncate">
            New Chat
          </h1>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-[280px]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-bg-primary/10 text-brand-bg-primary mx-auto mb-4">
            <Send className="h-6 w-6" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-dashboard-heading mb-1">
            How can we help?
          </h2>
          <p className="text-xs sm:text-sm text-dashboard-muted">
            Send a message below and our support team will respond as soon as possible.
          </p>
        </motion.div>
        {error && (
          <div className="mt-4 mx-auto max-w-[280px] w-full rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 py-3 sm:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 bg-dashboard-surface border-t border-dashboard-border">
        <form
          onSubmit={handleSend}
          className="flex gap-2 items-end max-w-2xl mx-auto"
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your issue..."
            rows={1}
            maxLength={5000}
            disabled={sending}
            className="flex-1 min-h-[40px] px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border rounded-xl text-dashboard-heading placeholder:text-dashboard-muted focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none overflow-y-auto disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
