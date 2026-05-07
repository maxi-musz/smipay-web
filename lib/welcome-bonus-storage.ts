const STORAGE_KEY = "smipay_welcome_bonus_congrats_tx_id";

export function getWelcomeBonusCongratsShownTxId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setWelcomeBonusCongratsShownTxId(txId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, txId);
  } catch {
    // ignore
  }
}
