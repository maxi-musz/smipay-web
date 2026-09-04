"use client";

import { useEffect, useState } from "react";
import { Loader2, Smartphone, User, FileWarning, Flag } from "lucide-react";
import { adminRewardsReportApi } from "@/services/admin/rewards-report-api";
import type {
  ForgedEvent,
  ForgedIncidentEvents,
} from "@/types/admin/rewards-report";

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n ?? 0);

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-dashboard-muted">
        {label}
      </div>
      <div className="text-xs text-dashboard-heading truncate" title={value ?? "—"}>
        {value || "—"}
      </div>
    </div>
  );
}

function EventCard({ e, first }: { e: ForgedEvent; first?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 ${first ? "border-red-300 bg-red-50/70 ring-1 ring-red-200" : "border-dashboard-border/60 bg-dashboard-surface"}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {first && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase">
              <Flag className="h-3 w-3" /> First event
            </span>
          )}
          <span className="text-xs font-semibold text-dashboard-heading">
            {when(e.event_time)}
          </span>
        </div>
        <span className="text-sm font-bold text-red-600 tabular-nums">
          {naira(e.amount)}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-dashboard-bg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-dashboard-heading">
            <User className="h-3.5 w-3.5" /> Account
          </div>
          <Field label="Name" value={e.user?.name} />
          <Field label="Phone" value={e.user?.phone} />
          <Field label="Email" value={e.user?.email} />
          <Field label="Status" value={e.user?.account_status} />
          <Field
            label="Joined"
            value={e.user ? when(e.user.joined_at) : null}
          />
        </div>

        <div className="rounded-lg bg-dashboard-bg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-dashboard-heading">
            <Smartphone className="h-3.5 w-3.5" /> Device
          </div>
          <Field
            label="Model / OS"
            value={
              e.device
                ? `${e.device.model ?? "—"} · ${e.device.platform ?? "—"} ${e.device.os_version ?? ""}`.trim()
                : null
            }
          />
          <Field label="App version" value={e.device?.app_version} />
          <Field label="IP address" value={e.device?.ip_address} />
          <Field label="Location" value={e.device?.location} />
          <Field
            label="First seen"
            value={e.device?.first_seen_at ? when(e.device.first_seen_at) : null}
          />
        </div>

        <div className="rounded-lg bg-dashboard-bg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-dashboard-heading">
            <FileWarning className="h-3.5 w-3.5" /> Forged payload
          </div>
          <Field label="Fake Paystack id" value={e.forged_payload.paystack_id} />
          <Field label="Reference" value={e.reference} />
          <Field label="Customer code" value={e.forged_payload.customer_code} />
          <Field label="Channel" value={e.forged_payload.channel} />
          <Field
            label="Gateway response"
            value={e.forged_payload.gateway_response}
          />
        </div>
      </div>
    </div>
  );
}

export function ForgedEventsPanel() {
  const [data, setData] = useState<ForgedIncidentEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminRewardsReportApi
      .getForgedIncidentEvents()
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-6 text-center">
        <Loader2 className="h-5 w-5 mx-auto animate-spin text-red-600" />
        <p className="mt-2 text-xs text-dashboard-muted">
          Loading attacker events…
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    );
  }
  if (!data || data.events.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-dashboard-muted">
        No forged-webhook events found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-dashboard-muted">
        <span className="font-semibold text-dashboard-heading">
          {data.total_events}
        </span>{" "}
        forged events across{" "}
        <span className="font-semibold text-dashboard-heading">
          {data.distinct_accounts}
        </span>{" "}
        accounts · first at{" "}
        <span className="font-semibold text-dashboard-heading">
          {data.first_event_at ? when(data.first_event_at) : "—"}
        </span>
      </div>
      <p className="text-[11px] text-dashboard-muted leading-relaxed">
        Tell-tale of a forgery: the &quot;Fake Paystack id&quot; is a UUID —
        genuine Paystack charge ids are numeric — and the device metadata is
        inconsistent (e.g. an &quot;iPhone&quot; model reported on Android).
      </p>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {data.events.map((e, i) => (
          <EventCard key={`${e.reference}-${i}`} e={e} first={i === 0} />
        ))}
      </div>
    </div>
  );
}
