/** Parsed VTPass /requery payload for admin UI. */

export type VtpassDeliveryVerdict =
  | "delivered"
  | "processing"
  | "failed"
  | "reversed"
  | "unknown";

export interface VtpassRequeryViewModel {
  verdict: VtpassDeliveryVerdict;
  verdictLabel: string;
  verdictDetail: string;
  code: string | null;
  responseDescription: string | null;
  txStatus: string | null;
  requestId: string | null;
  transactionId: string | null;
  transactionDate: string | null;
  productName: string | null;
  serviceType: string | null;
  amount: string | null;
  totalAmount: string | null;
  commission: string | null;
  recipient: string | null;
  purchasedCode: string | null;
  channel: string | null;
  platform: string | null;
  method: string | null;
  phone: string | null;
  email: string | null;
  detailRows: Array<{ label: string; value: string }>;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function str(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v);
}

function normalizeCode(code: unknown): string | null {
  const s = str(code);
  if (!s) return null;
  return s.replace(/^"+|"+$/g, "").padStart(3, "0").slice(-3);
}

const FAILED_CODES = new Set(["016", "091", "040"]);
const PROCESSING_CODES = new Set(["099", "089"]);

function resolveVerdict(
  code: string | null,
  txStatus: string | null,
  responseDescription: string | null,
): Pick<VtpassRequeryViewModel, "verdict" | "verdictLabel" | "verdictDetail"> {
  const status = txStatus?.toLowerCase() ?? "";
  const desc = responseDescription?.trim() ?? "";

  if (code === "040" || status === "reversed") {
    return {
      verdict: "reversed",
      verdictLabel: "Reversed",
      verdictDetail: desc || "VTPass reports this transaction was reversed.",
    };
  }

  if (
    FAILED_CODES.has(code ?? "") ||
    status === "failed" ||
    status === "cancelled"
  ) {
    return {
      verdict: "failed",
      verdictLabel: "Not delivered",
      verdictDetail: desc || "VTPass reports this transaction did not complete successfully.",
    };
  }

  if (code === "000" && (status === "delivered" || status === "success")) {
    return {
      verdict: "delivered",
      verdictLabel: "Delivered",
      verdictDetail: desc || "Service was delivered successfully on VTPass.",
    };
  }

  if (
    PROCESSING_CODES.has(code ?? "") ||
    status === "pending" ||
    status === "initiated" ||
    status === "processing"
  ) {
    return {
      verdict: "processing",
      verdictLabel: "Still processing",
      verdictDetail:
        desc || "VTPass has not confirmed final delivery yet. Requery again later.",
    };
  }

  if (code === "000" && !status) {
    return {
      verdict: "delivered",
      verdictLabel: "Successful",
      verdictDetail: desc || "VTPass returned code 000.",
    };
  }

  if (code === "000") {
    return {
      verdict: "processing",
      verdictLabel: "Pending confirmation",
      verdictDetail:
        desc ||
        `VTPass code 000 but status is "${status || "unknown"}". Treat as pending until delivered.`,
    };
  }

  if (code === "015") {
    return {
      verdict: "failed",
      verdictLabel: "Request not found",
      verdictDetail: desc || "VTPass does not recognise this request_id.",
    };
  }

  return {
    verdict: "unknown",
    verdictLabel: "Status unclear",
    verdictDetail:
      desc ||
      `Code ${code ?? "—"} / status ${status || "—"}. Review details or requery again.`,
  };
}

export function parseVtpassRequeryPayload(
  payload: unknown,
): VtpassRequeryViewModel | null {
  const root = asRecord(payload);
  if (!root) return null;

  const content = asRecord(root.content);
  const tx = asRecord(content?.transactions);

  const code = normalizeCode(root.code);
  const responseDescription = str(root.response_description);
  const txStatus = str(tx?.status);
  const verdictParts = resolveVerdict(code, txStatus, responseDescription);

  const productName = str(tx?.product_name);
  const serviceType = str(tx?.type);
  const amount = str(root.amount ?? tx?.amount);
  const totalAmount = str(tx?.total_amount);
  const commission = str(tx?.commission);
  const recipient =
    str(tx?.unique_element) ??
    str(tx?.billersCode) ??
    str(tx?.customerName);
  const purchasedCode = str(root.purchased_code) || str(tx?.purchased_code);

  const requestId =
    str(root.requestId) ?? str(root.request_id) ?? str(content?.requestId);
  const transactionId = str(tx?.transactionId);
  const transactionDate = str(root.transaction_date);

  const channel = str(tx?.channel);
  const platform = str(tx?.platform);
  const method = str(tx?.method);
  const phone = str(tx?.phone);
  const email = str(tx?.email);

  const detailRows: Array<{ label: string; value: string }> = [];

  const push = (label: string, value: string | null) => {
    if (value) detailRows.push({ label, value });
  };

  push("VTPass code", code);
  push("Transaction status", txStatus);
  push("Product", productName);
  push("Service type", serviceType);
  push("Amount", amount != null ? `₦${Number(amount).toLocaleString("en-NG")}` : null);
  push(
    "Total charged",
    totalAmount != null ? `₦${Number(totalAmount).toLocaleString("en-NG")}` : null,
  );
  push(
    "Commission",
    commission != null ? `₦${Number(commission).toLocaleString("en-NG")}` : null,
  );
  push("Recipient / meter / phone", recipient);
  push("Token / PIN", purchasedCode);
  push("VTPass transaction ID", transactionId);
  push("Transaction date", transactionDate);
  push("Channel", channel);
  push("Platform", platform);
  push("Method", method);
  push("Customer phone", phone);
  push("Customer email", email);

  return {
    ...verdictParts,
    code,
    responseDescription,
    txStatus,
    requestId,
    transactionId,
    transactionDate,
    productName,
    serviceType,
    amount,
    totalAmount,
    commission,
    recipient,
    purchasedCode,
    channel,
    platform,
    method,
    phone,
    email,
    detailRows,
  };
}

/** True when VTPass shows delivered but local row is still pending/failed. */
export function canResolveVtpassTransaction(
  localStatus: string | null | undefined,
  verdict: VtpassDeliveryVerdict | null | undefined,
): boolean {
  if (localStatus === "success") return false;
  if (verdict !== "delivered") return false;
  return localStatus === "pending" || localStatus === "failed";
}
