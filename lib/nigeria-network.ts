export type NigeriaNetwork = "mtn" | "glo" | "airtel" | "9mobile" | "unknown";

const NETWORK_PREFIXES: Record<NigeriaNetwork, string[]> = {
  mtn: [
    "0803",
    "0806",
    "0703",
    "0706",
    "0810",
    "0813",
    "0814",
    "0816",
    "0903",
    "0906",
  ],
  glo: ["0805", "0807", "0811", "0705", "0815", "0905"],
  airtel: ["0802", "0808", "0812", "0701", "0708", "0901", "0902", "0907"],
  "9mobile": ["0809", "0817", "0818", "0908", "0909"],
  unknown: [],
};

function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits;
  }

  if (digits.length === 13 && digits.startsWith("234")) {
    return `0${digits.slice(3)}`;
  }

  if (digits.length === 10 && !digits.startsWith("0")) {
    return `0${digits}`;
  }

  return digits;
}

export function getNigeriaNetworkForPhone(raw: string): NigeriaNetwork {
  const phone = normalizePhoneNumber(raw);

  if (phone.length < 4) {
    return "unknown";
  }

  const prefix = phone.slice(0, 4);

  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return network as NigeriaNetwork;
    }
  }

  return "unknown";
}

export function doesPhoneMatchNigeriaService(
  phone: string,
  serviceLabel: string,
): boolean {
  const network = getNigeriaNetworkForPhone(phone);

  if (network === "unknown") {
    return false;
  }

  const label = serviceLabel.toLowerCase();

  if (network === "9mobile") {
    return label.includes("9mobile") || label.includes("etisalat");
  }

  return label.includes(network);
}

