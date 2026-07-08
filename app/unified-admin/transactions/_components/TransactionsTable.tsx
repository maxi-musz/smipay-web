"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  CornerDownRight,
  ChevronDown,
  Wallet,
  Gift,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react";
import type { TransactionItem } from "@/types/admin/transactions";
import { useAuth } from "@/hooks/useAuth";
import { isDevAdminEmail } from "@/lib/dev-admin";
import {
  formatTransactionPartnerLabel,
  partnerBadgeClass,
  resolveTransactionPartnerFromRow,
} from "@/lib/transaction-partner";
import { adminTransactionsApi } from "@/services/admin/transactions-api";
import { useAdminTransactionsStore } from "@/store/admin/admin-transactions-store";
import { RequeryVtpassModal } from "./RequeryVtpassModal";

function formatNGN(value: number | null): string {
  if (value == null) return "—";
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const USER_NAME_MAX_LEN = 17;

function truncateDisplayName(name: string, maxLen = USER_NAME_MAX_LEN): string {
  if (!name || name === "—") return name;
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}...`;
}

const statusBadge: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  reversed: "bg-violet-50 text-violet-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const typeBadge: Record<string, string> = {
  transfer: "bg-blue-50 text-blue-700",
  deposit: "bg-emerald-50 text-emerald-700",
  airtime: "bg-purple-50 text-purple-700",
  data: "bg-indigo-50 text-indigo-700",
  cable: "bg-pink-50 text-pink-700",
  education: "bg-teal-50 text-teal-700",
  betting: "bg-orange-50 text-orange-700",
};

function CopyRef({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 group"
      title={value}
    >
      <span className="font-mono whitespace-nowrap">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  );
}

interface Props {
  transactions: TransactionItem[];
  isLoading?: boolean;
  /** When listing a single user’s txs (e.g. `?user_id=`), the User column is redundant. */
  hideUserColumn?: boolean;
}

/** Consecutive rows with the same user id (current page order only). */
function buildConsecutiveUserRuns(list: TransactionItem[]): Array<{
  startIndex: number;
  items: TransactionItem[];
}> {
  const runs: Array<{ startIndex: number; items: TransactionItem[] }> = [];
  let i = 0;
  while (i < list.length) {
    const uid = list[i].user?.id;
    let j = i + 1;
    if (uid) {
      while (j < list.length && list[j].user?.id === uid) j++;
    }
    const items = list.slice(i, j);
    if (items.length >= 2 && uid) {
      runs.push({ startIndex: i, items });
    }
    i = j;
  }
  return runs;
}

function runKey(anchor: TransactionItem, startIndex: number): string {
  return anchor.id ?? `run-${startIndex}`;
}

/** Same “retry streak” if user + status + type + amount match (current page only). */
function streakForward(
  list: TransactionItem[],
  i: number,
): { length: number; isStart: boolean; continuesUser: boolean } {
  const t = list[i];
  const uid = t.user?.id;
  const continuesUser = Boolean(uid && i > 0 && list[i - 1].user?.id === uid);

  if (!uid) {
    return { length: 1, isStart: true, continuesUser: false };
  }

  const sameShape = (a: TransactionItem, b: TransactionItem) =>
    a.user?.id === b.user?.id &&
    a.status === b.status &&
    a.transaction_type === b.transaction_type &&
    Number(a.amount) === Number(b.amount);

  let length = 1;
  for (let j = i + 1; j < list.length; j++) {
    if (!sameShape(t, list[j])) break;
    length++;
  }

  const prevMatches =
    i > 0 && sameShape(t, list[i - 1]);
  const isStart = length >= 2 && !prevMatches;

  return { length, isStart, continuesUser };
}

/** Compare stored wallet movement to amount + cashback_used (VT-style debits). */
function txnBalanceIntegrity(tx: TransactionItem): "ok" | "warn" | "na" {
  if (tx.amount == null || tx.credit_debit == null) return "na";
  const amt = Number(tx.amount);
  const bb = Number(tx.balance_before);
  const ba = Number(tx.balance_after);
  const d = ba - bb;
  const eps = 0.05;
  const cbUsed = Number(tx.cashback_used ?? 0);

  if (tx.credit_debit === "credit") {
    if (Math.abs(amt) < eps && Math.abs(d) < eps) return "ok";
    return Math.abs(d - amt) < eps ? "ok" : "warn";
  }
  if (tx.credit_debit === "debit") {
    const expected = -(amt - cbUsed);
    return Math.abs(d - expected) < eps ? "ok" : "warn";
  }
  return "na";
}

function WalletStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-medium text-dashboard-muted uppercase tracking-wide leading-none">{label}</p>
      <p className="text-xs font-semibold tabular-nums text-dashboard-heading mt-1 leading-tight">{value}</p>
    </div>
  );
}

/** Table cell: same Balance column pattern as admin users list + compact breakdown popover. */
function WalletBalanceCell({ tx }: { tx: TransactionItem }) {
  const { user: authUser } = useAuth();
  const devIntegrityMark = isDevAdminEmail(authUser?.email);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const bb = Number(tx.balance_before);
  const ba = Number(tx.balance_after);
  const mainDelta = ba - bb;
  const liveMain = tx.user?.wallet?.current_balance;
  const liveMainNum = liveMain != null && !Number.isNaN(Number(liveMain)) ? Number(liveMain) : null;
  const driftW = liveMainNum != null ? liveMainNum - ba : null;

  const cbb = tx.cashback_balance_before;
  const cba = tx.cashback_balance_after;
  const curC = tx.user?.cashbackWallet?.current_balance;
  const cbUsed = tx.cashback_used != null ? Number(tx.cashback_used) : 0;
  const hasCb =
    cbb != null ||
    cba != null ||
    cbUsed > 0 ||
    (curC != null && !Number.isNaN(Number(curC)));
  const curCNum = curC != null && !Number.isNaN(Number(curC)) ? Number(curC) : null;
  const cbaNum = cba != null && !Number.isNaN(Number(cba)) ? Number(cba) : null;
  const driftC = curCNum != null && cbaNum != null ? curCNum - cbaNum : null;

  const integrity = txnBalanceIntegrity(tx);
  const showLive = liveMainNum != null;
  const integrityWarn = integrity === "warn";
  const cashbackUsedOnTx = cbUsed > 0;
  const rowIntegrityOk = integrity === "ok";
  const showDevIntegrityCheck = devIntegrityMark && rowIntegrityOk;
  const funding =
    tx.user?.wallet?.all_time_fuunding != null && !Number.isNaN(Number(tx.user.wallet.all_time_fuunding))
      ? Number(tx.user.wallet.all_time_fuunding)
      : null;

  const updatePosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = 300;
    const left = Math.max(8, Math.min(r.right - panelW, window.innerWidth - panelW - 8));
    setPanelPos({ top: r.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        className="fixed z-[200] w-[min(300px,calc(100vw-16px))] rounded-xl border border-dashboard-border/60 bg-dashboard-surface shadow-xl shadow-black/10 overflow-hidden"
        style={{ top: panelPos.top, left: panelPos.left }}
        role="dialog"
        aria-label="Wallet breakdown for this transaction"
      >
        <div className="px-3 py-2 border-b border-dashboard-border/40 bg-dashboard-bg/50">
          <p className="text-xs font-bold text-dashboard-heading">Wallet breakdown</p>
          <p className="text-[10px] text-dashboard-muted mt-0.5 leading-snug">This row and live customer balances when loaded.</p>
        </div>

        <div
          className="px-3 py-2 max-h-[min(70vh,400px)] overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className={`rounded-lg px-2.5 py-2 flex gap-2 mb-3 ${
              integrityWarn ? "bg-amber-50 border border-amber-200/80" : "bg-emerald-50/80 border border-emerald-200/60"
            }`}
          >
            {integrityWarn ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-dashboard-heading">
                {integrityWarn ? "Review suggested" : "Row looks consistent"}
              </p>
              <p className="text-[9px] text-dashboard-muted mt-0.5 leading-snug">
                {integrityWarn
                  ? "Main delta doesn’t match amount + cashback split — open detail."
                  : integrity === "ok"
                    ? "Main movement matches amount and cashback used."
                    : "Not enough row data for this check."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashboard-border/30 bg-white/60 p-2.5">
            <div className="flex items-center gap-1.5 mb-2 text-violet-700">
              <Wallet className="h-3 w-3 shrink-0" />
              <span className="text-[10px] font-bold">Main (this row)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <WalletStat label="Before" value={formatNGN(bb)} />
              <WalletStat label="After" value={formatNGN(ba)} />
              <WalletStat label="Δ Main" value={`${mainDelta >= 0 ? "+" : ""}${formatNGN(mainDelta)}`} />
              <WalletStat label="Live now" value={showLive ? formatNGN(liveMainNum) : "—"} />
            </div>
            {!showLive ? (
              <p className="text-[9px] text-dashboard-muted mt-1.5 leading-snug">
                Live balance not in list payload; Balance column uses after-tx snapshot.
              </p>
            ) : driftW != null && Math.abs(driftW) > 0.5 ? (
              <p className="text-[9px] text-dashboard-muted mt-1.5 leading-snug">
                Live {driftW > 0 ? "above" : "below"} “after” by {formatNGN(Math.abs(driftW))} — later activity.
              </p>
            ) : null}
          </div>

          {hasCb ? (
            <div className="rounded-lg border border-dashboard-border/30 bg-white/60 p-2.5 mt-2">
              <div className="flex items-center gap-1.5 mb-2 text-amber-800">
                <Gift className="h-3 w-3 shrink-0" />
                <span className="text-[10px] font-bold">Cashback</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <WalletStat label="Before" value={formatNGN(cbb != null ? Number(cbb) : null)} />
                <WalletStat label="Used" value={formatNGN(cbUsed > 0 ? cbUsed : null)} />
                <WalletStat label="After" value={formatNGN(cba != null ? Number(cba) : null)} />
                <WalletStat label="Live now" value={curCNum != null ? formatNGN(curCNum) : "—"} />
              </div>
              {curCNum != null && driftC != null && Math.abs(driftC) > 0.5 ? (
                <p className="text-[9px] text-dashboard-muted mt-1.5 leading-snug">
                  Live differs from “after” by {formatNGN(Math.abs(driftC))}.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[10px] text-dashboard-muted mt-2 py-0.5">No cashback on this row.</p>
          )}

          <Link
            href={`/unified-admin/transactions/${tx.id}`}
            className="mt-2.5 block text-center text-[10px] font-semibold text-brand-bg-primary hover:underline py-1.5"
            onClick={() => setOpen(false)}
          >
            Full detail →
          </Link>
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={wrapRef} className="flex items-center justify-end gap-1 min-w-0">
      {showDevIntegrityCheck ? (
        <span className="shrink-0 inline-flex" title="Dev: row amount ↔ main/cashback movement OK">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        </span>
      ) : null}
      <div className="text-right min-w-0">
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[10px] leading-tight">
          <span className="text-dashboard-muted whitespace-nowrap">
            Before -{" "}
            <span className="font-semibold tabular-nums text-dashboard-heading">
              {formatNGN(Number.isFinite(bb) ? bb : null)}
            </span>
          </span>
          <span className="text-dashboard-muted whitespace-nowrap">
            After -{" "}
            <span className="font-semibold tabular-nums text-dashboard-heading">
              {formatNGN(Number.isFinite(ba) ? ba : null)}
            </span>
          </span>
          <span className="text-dashboard-muted whitespace-nowrap">
            All time - <span className="font-semibold tabular-nums text-dashboard-heading">{formatNGN(funding)}</span>
          </span>
          {cashbackUsedOnTx ? (
            <>
              <span className="text-dashboard-muted whitespace-nowrap">
                CB before -{" "}
                <span className="font-semibold tabular-nums text-violet-700/90">
                  {formatNGN(cbb != null && Number.isFinite(Number(cbb)) ? Number(cbb) : null)}
                </span>
              </span>
              <span className="text-dashboard-muted whitespace-nowrap">
                CB after -{" "}
                <span className="font-semibold tabular-nums text-violet-700/90">
                  {formatNGN(cba != null && Number.isFinite(Number(cba)) ? Number(cba) : null)}
                </span>
              </span>
            </>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!open) updatePosition();
          setOpen((v) => !v);
        }}
        className={`shrink-0 p-1 rounded-md border transition-colors ${
          integrityWarn
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-dashboard-border/60 bg-dashboard-surface text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
        } ${open ? "ring-2 ring-brand-bg-primary/25 border-brand-bg-primary/40" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Show wallet breakdown"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {panel}
    </div>
  );
}

interface TxDeviceInfo {
  id: string;
  device_model: string | null;
  device_name: string | null;
  platform: "ios" | "android";
  os_name: string | null;
  os_version: string | null;
  app_version: string | null;
  is_active: boolean;
  is_restricted: boolean;
  last_ip_address: string | null;
  last_location: string | null;
  last_seen_at: string;
}

function TxDeviceCell({ userDevices }: { userDevices?: TxDeviceInfo[] }) {
  const [open, setOpen] = useState(false);
  const device = userDevices?.[0];
  if (!device) return <span className="text-[11px] text-dashboard-muted/50">—</span>;
  return (
    <div className="relative">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} className="flex items-center gap-1.5 text-left group">
        <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${device.platform === "ios" ? "bg-blue-500" : "bg-green-500"}`} />
        <span className="text-[11px] text-dashboard-heading truncate max-w-[90px]">
          {device.device_model || (device.platform === "ios" ? "iOS" : "Android")}
        </span>
        <ChevronDown className={`h-3 w-3 text-dashboard-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 w-60 bg-white border border-dashboard-border/60 rounded-lg shadow-lg p-3 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-dashboard-muted">Platform</span><span className="font-medium">{device.platform === "ios" ? "iOS" : "Android"}</span></div>
          <div className="flex justify-between"><span className="text-dashboard-muted">Model</span><span className="font-medium">{device.device_model || "—"}</span></div>
          <div className="flex justify-between"><span className="text-dashboard-muted">OS</span><span className="font-medium">{device.os_name ?? "—"} {device.os_version ?? ""}</span></div>
          <div className="flex justify-between"><span className="text-dashboard-muted">App Version</span><span className="font-medium">{device.app_version || "—"}</span></div>
          <div className="flex justify-between"><span className="text-dashboard-muted">Last IP</span><span className="font-mono text-[11px]">{device.last_ip_address || "—"}</span></div>
          <div className="flex justify-between"><span className="text-dashboard-muted">Location</span><span className="font-medium">{device.last_location || "—"}</span></div>
          <div className="flex justify-between"><span className="text-dashboard-muted">Status</span><span className={`font-semibold ${device.is_restricted ? "text-red-600" : device.is_active ? "text-emerald-600" : "text-slate-500"}`}>{device.is_restricted ? "Restricted" : device.is_active ? "Active" : "Inactive"}</span></div>
          <div className="pt-1 border-t border-dashboard-border/30">
            <Link href={`/unified-admin/devices/${device.id}`} className="text-[11px] font-semibold text-brand-bg-primary hover:underline">View device details →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

const TABLE_COL_COUNT = 15;
const TABLE_COL_COUNT_NO_USER = 14;

function TransactionPartnerCell({ tx }: { tx: TransactionItem }) {
  const partner = resolveTransactionPartnerFromRow(tx);
  const label =
    tx.rail_partner_label?.trim() ||
    formatTransactionPartnerLabel(partner);
  if (partner === "unknown") {
    return <span className="text-[11px] text-dashboard-muted">—</span>;
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${partnerBadgeClass(partner)}`}
      title={
        tx.provider && tx.provider.toLowerCase() !== partner
          ? `Service: ${tx.provider}`
          : `Partner: ${label}`
      }
    >
      {label}
    </span>
  );
}

/**
 * Per-row actions grouped under a three-dot (kebab) menu so the Actions column
 * stays compact as more actions are added. Today the only action is "Requery
 * VTPass status" (VTPass rows only); it's disabled once a transaction is already
 * successful since there's nothing to reconcile.
 */
function ActionsMenu({ tx }: { tx: TransactionItem }) {
  const partner = resolveTransactionPartnerFromRow(tx);
  const canRequery = partner === "vtpass";
  const alreadySuccessful = tx.status === "success";

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Requery modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  const MENU_WIDTH = 224; // matches w-56 below
  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setMenuPos({ top: r.bottom + 6, left });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
    const onScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [menuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // No actions apply to this row — keep the column clean.
  if (!canRequery) {
    return <span className="text-[11px] text-dashboard-muted">—</span>;
  }

  const runRequery = async () => {
    if (alreadySuccessful || loading) return;
    setMenuOpen(false);
    setModalOpen(true);
    setLoading(true);
    setError(null);
    setPayload(null);
    try {
      const res = await adminTransactionsApi.requeryVtpass(tx.id);
      setPayload(res.data?.vtpass_response ?? res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Requery failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResolved = () => {
    const store = useAdminTransactionsStore.getState();
    store.invalidateListCache();
    void store.fetchTransactions(true);
  };

  const menu =
    menuOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[200] w-56 rounded-xl border border-dashboard-border/60 bg-dashboard-surface shadow-xl shadow-black/10 overflow-hidden py-1"
        style={{ top: menuPos.top, left: menuPos.left }}
        role="menu"
        aria-label="Transaction actions"
      >
        <button
          type="button"
          role="menuitem"
          onClick={runRequery}
          disabled={alreadySuccessful || loading}
          aria-disabled={alreadySuccessful || loading}
          className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
            alreadySuccessful
              ? "cursor-not-allowed text-dashboard-muted/60"
              : "text-dashboard-heading hover:bg-dashboard-bg"
          }`}
          title={
            alreadySuccessful
              ? "Transaction is already successful — no requery needed"
              : `Requery VTPass status for ${tx.transaction_reference ?? tx.id}`
          }
        >
          <RefreshCw
            className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${loading ? "animate-spin" : ""}`}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold">Requery status</span>
            <span className="block text-[10px] leading-tight mt-0.5 text-dashboard-muted/80">
              {alreadySuccessful ? "Already successful" : "Check latest VTPass status"}
            </span>
          </span>
        </button>
      </div>,
      document.body,
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!menuOpen) updateMenuPosition();
          setMenuOpen((v) => !v);
        }}
        className={`inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors ${
          menuOpen
            ? "border-brand-bg-primary/40 bg-dashboard-bg text-brand-bg-primary ring-2 ring-brand-bg-primary/20"
            : "border-dashboard-border/60 bg-dashboard-surface text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
        }`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Transaction actions"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
      <RequeryVtpassModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transactionId={tx.id}
        localStatus={tx.status}
        requestId={tx.transaction_reference}
        loading={loading}
        error={error}
        payload={payload}
        onResolved={handleResolved}
      />
    </>
  );
}

export function TransactionsTable({ transactions, isLoading = false, hideUserColumn = false }: Props) {
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(() => new Set());

  const consecutiveRuns = useMemo(
    () => buildConsecutiveUserRuns(transactions),
    [transactions],
  );

  const { hiddenIndices, collapseBeforeIndex, collapseAfterIndex } = useMemo(() => {
    const hidden = new Set<number>();
    const before = new Map<
      number,
      { followerCount: number; key: string; expanded: boolean }
    >();
    const after = new Map<
      number,
      { followerCount: number; key: string; expanded: boolean }
    >();

    for (const run of consecutiveRuns) {
      const key = runKey(run.items[0], run.startIndex);
      const expanded = expandedRuns.has(key);
      const ctl = {
        followerCount: run.items.length - 1,
        key,
        expanded,
      };
      if (!expanded) {
        for (let k = 1; k < run.items.length; k++) {
          hidden.add(run.startIndex + k);
        }
        before.set(run.startIndex, ctl);
      } else {
        after.set(run.startIndex + run.items.length - 1, ctl);
      }
    }

    return {
      hiddenIndices: hidden,
      collapseBeforeIndex: before,
      collapseAfterIndex: after,
    };
  }, [consecutiveRuns, expandedRuns]);

  const toggleRun = useCallback((key: string) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const colCount = hideUserColumn ? TABLE_COL_COUNT_NO_USER : TABLE_COL_COUNT;

  if (!transactions.length && !isLoading) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-12 text-center">
        <p className="text-sm text-dashboard-muted">No transactions found</p>
      </div>
    );
  }

  return (
    <div
      className="relative bg-dashboard-surface rounded-xl border border-dashboard-border/40 overflow-hidden shadow-sm"
      aria-busy={isLoading}
    >
      {isLoading && transactions.length === 0 && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-dashboard-surface/70 backdrop-blur-[2px] rounded-xl"
          aria-live="polite"
          aria-label="Loading transactions"
        >
          <Loader2 className="h-7 w-7 animate-spin text-brand-bg-primary" />
          <p className="text-xs font-medium text-dashboard-muted">Updating list…</p>
        </div>
      )}
      <p className="px-4 py-2.5 text-[11px] text-dashboard-muted border-b border-dashboard-border/30 bg-dashboard-bg/30 leading-relaxed">
        <span className="font-medium text-dashboard-heading/80">Ledger view:</span> each row is one distinct
        reference (separate attempt).
        {hideUserColumn
          ? " Consecutive attempts with the same status, type, and amount are visually grouped; rows are not merged."
          : " Consecutive attempts from the same user are grouped; expand “+ N more” to see each row. Rows are not merged so audits stay traceable."}
      </p>
      <div className="overflow-x-auto">
        <table
          className={`w-full text-xs ${hideUserColumn ? "min-w-[1160px]" : "min-w-[1280px]"}`}
        >
          <thead>
            <tr className="border-b border-dashboard-border/40 bg-dashboard-bg/50">
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted whitespace-nowrap">Date</th>
              {!hideUserColumn && (
                <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted w-0 max-w-[11rem]">User</th>
              )}
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted">Amount</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Type</th>
              <th
                className="text-left px-4 py-2.5 font-medium text-dashboard-muted whitespace-nowrap"
                title="Infrastructure partner / payment rail (Paystack, VTPass, …)"
              >
                Partner
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted w-0 max-w-[10rem]">
                Plan
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Status</th>
              <th
                className="text-right px-2 py-2.5 font-medium text-dashboard-muted min-w-[9rem] border-l border-dashboard-border/15 bg-dashboard-bg/30"
                title="Before, after, all-time funded; if cashback used: CB before/after. Dev-only green check when row sanity passes. Chevron: full breakdown."
              >
                <span className="whitespace-nowrap">Balance</span>
              </th>
              <th className="text-center px-4 py-2.5 font-medium text-dashboard-muted">Dir</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Channel</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Device</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted">Revenue</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted" title="Commission (Smipay earned)">Commission</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Reference</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => {
              if (hiddenIndices.has(i)) return null;

              const collapseBefore = collapseBeforeIndex.get(i);
              const collapseAfter = collapseAfterIndex.get(i);

              const userName = hideUserColumn
                ? ""
                : tx.user
                  ? [tx.user.first_name, tx.user.last_name].filter(Boolean).join(" ") || tx.user.email || tx.user.phone_number
                  : "—";
              const avatar = hideUserColumn ? "" : (tx.user?.first_name?.[0]?.toUpperCase() ?? "?");
              const { length: streakLen, isStart: streakStart, continuesUser } = streakForward(transactions, i);
              const rowMuted = continuesUser;
              const collapseCtl = collapseBefore ?? collapseAfter;
              return (
                <Fragment key={tx.id}>
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className={`border-b border-dashboard-border/20 hover:bg-dashboard-bg/40 transition-colors ${
                    continuesUser ? "bg-dashboard-bg/20" : ""
                  } ${streakStart ? "border-t border-dashboard-border/35" : ""}`}
                >
                  <td
                    className={`px-4 py-2.5 text-left text-dashboard-muted whitespace-nowrap align-middle ${
                      continuesUser ? "border-l-2 border-l-brand-bg-primary/25" : ""
                    }`}
                    title={new Date(tx.createdAt).toLocaleString()}
                  >
                    {relativeTime(tx.createdAt)}
                  </td>
                  {!hideUserColumn && (
                    <td className="px-4 py-2 align-middle w-0 max-w-[11rem] min-w-0">
                      {continuesUser ? (
                        <div className="flex items-center gap-2 min-h-[2rem] pl-1">
                          <CornerDownRight className="h-3.5 w-3.5 text-dashboard-muted/70 shrink-0" aria-hidden />
                          <div className="min-w-0 flex flex-col gap-0.5">
                            <span className="text-[10px] text-dashboard-muted">Same user</span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <Link
                                href={`/unified-admin/transactions/${tx.id}`}
                                className="text-[10px] font-medium text-brand-bg-primary hover:underline"
                                title="Open this transaction"
                              >
                                Transaction
                              </Link>
                              {tx.user?.id ? (
                                <Link
                                  href={`/unified-admin/users/${tx.user.id}`}
                                  className="text-[10px] font-medium text-brand-bg-primary/90 hover:underline truncate max-w-[120px]"
                                  title="Open user profile"
                                >
                                  Profile
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {streakStart ? (
                            <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200/80">
                              {streakLen} similar {tx.status === "failed" ? "failures" : "attempts"}
                            </span>
                          ) : null}
                          <Link href={`/unified-admin/transactions/${tx.id}`} className="flex items-center gap-2 group/row">
                            {tx.user?.profile_image?.secure_url ? (
                              <img src={tx.user.profile_image.secure_url} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-dashboard-border/40" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-brand-bg-primary/10 text-brand-bg-primary flex items-center justify-center text-[10px] font-bold ring-1 ring-dashboard-border/40">
                                {avatar}
                              </div>
                            )}
                            <span
                              className="text-dashboard-heading font-medium whitespace-nowrap group-hover/row:text-brand-bg-primary transition-colors"
                              title={userName.length > USER_NAME_MAX_LEN ? userName : undefined}
                            >
                              {truncateDisplayName(userName)}
                            </span>
                          </Link>
                        </div>
                      )}
                    </td>
                  )}
                  <td
                    className={`px-4 py-2.5 text-right font-semibold text-dashboard-heading whitespace-nowrap tabular-nums ${rowMuted ? "text-dashboard-heading/90" : ""}`}
                  >
                    {hideUserColumn ? (
                      <div className="flex flex-col items-end gap-1">
                        {streakStart ? (
                          <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200/80">
                            {streakLen} similar {tx.status === "failed" ? "failures" : "attempts"}
                          </span>
                        ) : null}
                        {continuesUser ? (
                          <div className="flex items-center gap-1 text-[10px] text-dashboard-muted">
                            <CornerDownRight className="h-3 w-3 shrink-0" aria-hidden />
                            <span>Same pattern</span>
                          </div>
                        ) : null}
                        <Link
                          href={`/unified-admin/transactions/${tx.id}`}
                          className="tabular-nums hover:text-brand-bg-primary transition-colors"
                        >
                          {formatNGN(tx.amount)}
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/unified-admin/transactions/${tx.id}`}
                        className={`block text-right font-semibold whitespace-nowrap tabular-nums hover:text-brand-bg-primary transition-colors ${
                          rowMuted ? "text-dashboard-heading/90" : "text-dashboard-heading"
                        }`}
                      >
                        {formatNGN(tx.amount)}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {tx.transaction_type && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${typeBadge[tx.transaction_type] ?? "bg-slate-100 text-slate-600"}`}>
                        {tx.transaction_type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <TransactionPartnerCell tx={tx} />
                  </td>
                  <td className="px-4 py-2.5 text-dashboard-heading w-0 max-w-[10rem] min-w-0 align-middle">
                    {(() => {
                      const plan = tx.data_plan_name?.trim() ?? "";
                      if (!plan) return <span className="text-dashboard-muted">—</span>;
                      return (
                        <span
                          className="block truncate text-[11px] leading-tight text-dashboard-heading"
                          title={plan}
                        >
                          {plan}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5">
                    {tx.status && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusBadge[tx.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {tx.status}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 align-middle border-l border-dashboard-border/15 bg-dashboard-bg/10 w-0 whitespace-nowrap">
                    <WalletBalanceCell tx={tx} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {tx.credit_debit === "credit" ? (
                      <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500 inline" />
                    ) : tx.credit_debit === "debit" ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-red-500 inline" />
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-dashboard-muted capitalize whitespace-nowrap">
                    {tx.payment_channel?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <TxDeviceCell userDevices={(tx as any).user?.userDevices} />
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {tx.markup_value != null ? (
                      <span className="text-emerald-600 font-medium">{formatNGN(tx.markup_value)}</span>
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums"
                    title={
                      tx.status === "failed"
                        ? "No commission on failed transactions"
                        : undefined
                    }
                  >
                    {tx.status === "failed" ? (
                      <span className="text-dashboard-muted">—</span>
                    ) : tx.commission_smipay_earned != null || tx.commission != null ? (
                      <span className="text-dashboard-heading font-medium">
                        {formatNGN(tx.commission_smipay_earned ?? tx.commission ?? 0)}
                      </span>
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-dashboard-muted">
                    {tx.transaction_reference ? <CopyRef value={tx.transaction_reference} /> : "—"}
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <ActionsMenu tx={tx} />
                  </td>
                </motion.tr>
                {collapseCtl ? (
                  <tr className="border-b border-dashboard-border/20 bg-dashboard-bg/25 hover:bg-dashboard-bg/40 transition-colors">
                    <td colSpan={colCount} className="px-4 py-1.5">
                      <button
                        type="button"
                        onClick={() => toggleRun(collapseCtl.key)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-bg-primary hover:underline pl-1"
                        aria-expanded={collapseCtl.expanded}
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                            collapseCtl.expanded ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        />
                        {collapseCtl.expanded
                          ? `Hide ${collapseCtl.followerCount} more transaction${
                              collapseCtl.followerCount === 1 ? "" : "s"
                            } from same user`
                          : `+ ${collapseCtl.followerCount} more transaction${
                              collapseCtl.followerCount === 1 ? "" : "s"
                            } from same user`}
                      </button>
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
