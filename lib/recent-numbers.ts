/**
 * Recent numbers cache for VTU services (airtime, data, cable TV).
 * Stores up to MAX_ENTRIES per service type in localStorage.
 * Each entry holds the provider (serviceID) and the number used.
 */

const MAX_ENTRIES = 5;

export type ServiceType = "airtime" | "data" | "cable" | "electricity";

export interface RecentEntry {
  serviceID: string;
  number: string;
  timestamp: number;
}

function storageKey(type: ServiceType): string {
  return `smipay_recent_${type}`;
}

export function getRecentEntries(type: ServiceType): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(type));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLastUsed(type: ServiceType): RecentEntry | null {
  const entries = getRecentEntries(type);
  return entries.length > 0 ? entries[0] : null;
}

export function saveRecentEntry(type: ServiceType, serviceID: string, number: string): void {
  if (typeof window === "undefined" || !serviceID || !number) return;

  const entries = getRecentEntries(type);

  // Remove duplicate if same provider+number already exists
  const filtered = entries.filter(
    (e) => !(e.serviceID === serviceID && e.number === number)
  );

  // Prepend the new entry
  filtered.unshift({ serviceID, number, timestamp: Date.now() });

  // Keep only MAX_ENTRIES
  const trimmed = filtered.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(storageKey(type), JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
