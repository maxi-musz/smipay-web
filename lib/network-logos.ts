/**
 * Network Logo Mapping
 * Maps VTPass service IDs to local logo assets
 */

export const NETWORK_LOGOS: Record<string, string> = {
  // Airtime service IDs
  mtn: "/vtu-logo/mtn-logo.jpg",
  glo: "/vtu-logo/glo-logo.png",
  airtel: "/vtu-logo/airtel-logo.svg",
  etisalat: "/vtu-logo/9mobile-logo.png",
  "9-mobile": "/vtu-logo/9mobile-logo.png",
  "foreign-airtime": "/vtu-logo/9mobile-logo.png", // Using 9mobile as fallback for international
  
  // Data service IDs
  "mtn-data": "/vtu-logo/mtn-logo.jpg",
  "glo-data": "/vtu-logo/glo-logo.png",
  "airtel-data": "/vtu-logo/airtel-logo.svg",
  "etisalat-data": "/vtu-logo/9mobile-logo.png",
  "glo-sme-data": "/vtu-logo/glo-logo.png",
  "smile-direct": "/vtu-logo/glo-logo.png", // Fallback - add smile logo if available
  "spectranet": "/vtu-logo/glo-logo.png", // Fallback - add spectranet logo if available
  
  // Cable TV service IDs
  dstv: "/imgs/cable-tv-logo/dstv-logo.png",
  gotv: "/imgs/cable-tv-logo/gotv-logo-png_seeklogo-496045.png",
  startimes: "/imgs/cable-tv-logo/startimes-logo.jpg",
  showmax: "/imgs/cable-tv-logo/showmax-logo.png",

  // Electricity service IDs (discos)
  "ikeja-electric": "/electricity-logo/ikeja-electric.jpeg",
  "eko-electric": "/electricity-logo/eko-electric.jpg",
  "kano-electric": "/electricity-logo/kano-electric.png",
  "portharcourt-electric": "/electricity-logo/ph-electric.jpg",
  "jos-electric": "/electricity-logo/jos-electric.jpeg",
  "ibadan-electric": "/electricity-logo/ibadan-electric.jpg",
  "kaduna-electric": "/electricity-logo/kaduna-electric.jpeg",
  "abuja-electric": "/electricity-logo/abuja-electric.png",
  "enugu-electric": "/electricity-logo/Enugu-electric.png",
  "benin-electric": "/electricity-logo/benin-electric.jpg",
  "aba-electric": "/electricity-logo/aba-electric.png",
  "yola-electric": "/electricity-logo/yola-electric.jpeg",

  // Education service IDs
  "waec-registration": "/education-logo/waec-logo.webp",
  waec: "/education-logo/waec-logo.webp",
  jamb: "/education-logo/jamb-logo.png",
};

/**
 * Get local logo path for a service ID
 * Returns null if logo not found
 * Supports airtime, data, and cable TV service IDs
 */
export function getNetworkLogo(serviceID: string): string | null {
  // Normalize service ID to lowercase
  const normalizedId = serviceID.toLowerCase().trim();
  
  // First, try exact match
  let logo = NETWORK_LOGOS[normalizedId];
  if (logo) {
    return logo;
  }
  
  // For data service IDs, try extracting the network name
  // e.g., "mtn-data" -> "mtn", "glo-data" -> "glo"
  if (normalizedId.includes("-data")) {
    const networkName = normalizedId.replace("-data", "").replace("-sme", "");
    logo = NETWORK_LOGOS[networkName];
    if (logo) {
      return logo;
    }
  }
  
  // For airtime service IDs, try extracting network name
  // e.g., "mtn-airtime" -> "mtn"
  if (normalizedId.includes("-airtime")) {
    const networkName = normalizedId.replace("-airtime", "");
    logo = NETWORK_LOGOS[networkName];
    if (logo) {
      return logo;
    }
  }
  
  // Cable TV service IDs are usually direct (dstv, gotv, etc.)
  // Already handled by exact match above

  // Electricity service IDs contain "-electric" suffix
  if (normalizedId.includes("-electric")) {
    logo = NETWORK_LOGOS[normalizedId];
    if (logo) return logo;
  }

  return null;
}

/**
 * Check if a logo exists for a service ID
 */
export function hasNetworkLogo(serviceID: string): boolean {
  return getNetworkLogo(serviceID) !== null;
}
