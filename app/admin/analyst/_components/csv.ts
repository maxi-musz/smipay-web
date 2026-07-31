/** Client-side CSV export for analytics datasets. */

import { analyticsApi } from "@/services/admin/analytics-api";

function escapeCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(input: readonly unknown[]): string {
  const rows = input as Record<string, unknown>[];
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export function downloadCsv(
  name: string,
  rows: readonly unknown[],
  audit?: { section: string; range: string },
) {
  if (rows.length === 0) return;
  if (audit) {
    void analyticsApi
      .auditExport({
        section: audit.section,
        dataset: name,
        row_count: rows.length,
        range: audit.range,
      })
      .catch(() => undefined);
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${name}-${stamp}.csv`;
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ExportSet {
  name: string;
  rows: readonly unknown[];
}
