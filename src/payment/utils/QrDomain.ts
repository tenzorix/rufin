export const QR_ALLOWED_DOMAINS = [
  "qr.nspk.ru",
  "multiqr.ru",
  "platiqr.ru",
] as const;

export type UtilityPaymentService = "jkh" | "gibdd";

const GIBDD_UIN_REGEX = /^\d{20,25}$/;
const GIBDD_QR_REGEX = /^gibdd:uin:(\d+)$/i;
const HOUSING_MIN_QR_LENGTH = 100;
const HOUSING_MAX_QR_LENGTH = 4296;
const HOUSING_MARKERS = [
  "st00012",
  "bik",
  "sum",
  "period",
  "els",
  "acc",
  "account",
  "inn",
  "kpp",
  "бик",
  "сум",
  "период",
  "елс",
  "счет",
  "счёт",
  "инн",
  "кпп",
] as const;

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, "");
}

function parseUrlCandidate(value: string): URL | null {
  const candidate = value.trim();
  if (!candidate) {
    return null;
  }

  try {
    return new URL(candidate);
  } catch {
    try {
      return new URL(`https://${candidate}`);
    } catch {
      return null;
    }
  }
}

export function isAllowedQrDomain(value: string): boolean {
  const parsed = parseUrlCandidate(value);
  if (!parsed) {
    return false;
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname) {
    return false;
  }

  return QR_ALLOWED_DOMAINS.some((domain) => {
    const normalizedDomain = normalizeHostname(domain);
    return (
      hostname === normalizedDomain ||
      hostname.endsWith(`.${normalizedDomain}`)
    );
  });
}

export function isGibddUin(value: string): boolean {
  return GIBDD_UIN_REGEX.test(value.trim());
}

export function detectUtilityPaymentService(
  value: unknown
): UtilityPaymentService | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (/^st00012\|/i.test(normalized)) {
    return "jkh";
  }

  if (isGibddUin(normalized) || GIBDD_QR_REGEX.test(normalized)) {
    return "gibdd";
  }

  return null;
}

export function isHousingQrPayload(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }
  if (
    normalized.length < HOUSING_MIN_QR_LENGTH ||
    normalized.length > HOUSING_MAX_QR_LENGTH
  ) {
    return false;
  }

  const hasLetters = /[A-Za-zА-Яа-я]/.test(normalized);
  const hasDigits = /\d/.test(normalized);
  const hasSeparator = /[|=;:\n]/.test(normalized);

  if (!hasLetters || !hasDigits || !hasSeparator) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  return HOUSING_MARKERS.some((marker) => lowered.includes(marker));
}

export function normalizePaymentQrForOrder(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const utilityPaymentService = detectUtilityPaymentService(normalized);
  if (utilityPaymentService === "gibdd") {
    const prefixedMatch = normalized.match(GIBDD_QR_REGEX);
    const uin = prefixedMatch?.[1] ?? (isGibddUin(normalized) ? normalized : null);
    return uin ? `gibdd:uin:${uin}` : null;
  }

  if (utilityPaymentService === "jkh" || isHousingQrPayload(normalized)) {
    return normalized;
  }

  if (isAllowedQrDomain(normalized)) {
    return normalized;
  }

  return null;
}

export function isSupportedPaymentQr(value: string): boolean {
  return normalizePaymentQrForOrder(value) !== null;
}
