import { normalizeTelegramInitData } from "@/telegram/initData";

type EnvRecord = Record<string, string | undefined>;

const TELEGRAM_PARAM_KEYS = [
  "tgWebAppData",
  "tg_web_app_data",
  "initData",
  "tgInitData",
  "telegram_init_data",
];

const ENV_KEYS = [
  "VITE_TELEGRAM_INIT_DATA",
  "NEXT_PUBLIC_TELEGRAM_INIT_DATA",
  "TELEGRAM_INIT_DATA",
];

const STORAGE_KEY = "telegram_init_data";
const HARDCODED_INIT_DATA = "";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

let cachedInitData: string | undefined;

export function getTelegramInitData(): string | undefined {
  if (cachedInitData) {
    const sanitized = sanitize(cachedInitData);
    if (sanitized) {
      cachedInitData = sanitized;
      return sanitized;
    }
    cachedInitData = undefined;
  }

  const value =
    readFromWebApp() ??
    readFromLocationHash() ??
    readFromLocationSearch() ??
    readFromEnv() ??
    readFromStorage() ??
    readFromHardcodedValue();

  if (value) {
    cachedInitData = value;
    persist(value);
  }

  return value;
}

export function setTelegramInitData(value: string | undefined): void {
  const sanitized = sanitize(value);
  if (!sanitized) {
    return;
  }
  cachedInitData = sanitized;
  persist(sanitized);
}

export function clearTelegramInitDataCache(): void {
  cachedInitData = undefined;
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage?.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }

  try {
    window.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function sanitize(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = normalizeTelegramInitData(value);
  return normalized.length > 0 ? normalized : undefined;
}

function readFromWebApp(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const telegram = (window as TelegramWindow).Telegram;
  const rawValue = telegram?.WebApp?.initData;
  return sanitize(rawValue);
}

function readFromLocationHash(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return extractFromParams(window.location.hash);
}

function readFromLocationSearch(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return extractFromParams(window.location.search);
}

function extractFromParams(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const normalized =
    raw.startsWith("#") || raw.startsWith("?") ? raw.slice(1) : raw;
  if (!normalized) {
    return undefined;
  }

  const params = new URLSearchParams(normalized);
  for (const key of TELEGRAM_PARAM_KEYS) {
    const value = params.get(key);
    const sanitized = sanitize(value);
    if (sanitized) {
      return sanitized;
    }
  }

  // Telegram may pass the raw init data string without a key.
  if (normalized.startsWith("user=")) {
    return sanitize(normalized);
  }

  return undefined;
}

function readFromStorage(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const sessionValue = window.sessionStorage?.getItem(STORAGE_KEY);
    if (sessionValue) {
      return sanitize(sessionValue);
    }
  } catch {
    // ignore storage errors
  }

  try {
    const localValue = window.localStorage?.getItem(STORAGE_KEY);
    if (localValue) {
      return sanitize(localValue);
    }
  } catch {
    // ignore storage errors
  }

  return undefined;
}

function persist(value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage?.setItem(STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

function readFromEnv(): string | undefined {
  const envSources = getEnvSources();
  for (const env of envSources) {
    for (const key of ENV_KEYS) {
      const value = sanitize(env?.[key]);
      if (value) {
        return value;
      }
    }
  }
  return undefined;
}

function readFromHardcodedValue(): string | undefined {
  return sanitize(HARDCODED_INIT_DATA);
}

function getEnvSources(): EnvRecord[] {
  const sources: EnvRecord[] = [];
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      sources.push(import.meta.env as EnvRecord);
    }
  } catch {
    // ignore
  }

  return sources;
}
