import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import { TELEGRAM_INIT_DATA } from "@/constants/env";

type TelegramWebApp = {
  initData?: unknown;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

const TELEGRAM_INIT_DATA_PARAM_KEYS = [
  "tgWebAppData",
  "tg_web_app_data",
  "initData",
  "tgInitData",
  "telegram_init_data",
];

export function normalizeTelegramInitData(value: string): string {
  const stripped = stripTelegramInitDataPrefixes(value);
  if (!stripped) return "";

  const extracted = extractTelegramInitDataParam(stripped);
  if (extracted && extracted !== stripped) {
    return normalizeTelegramInitData(extracted);
  }

  if (!hasTelegramHashParam(stripped)) {
    const decoded = decodeTelegramInitDataWrapper(stripped);
    if (decoded && decoded !== stripped) {
      return normalizeTelegramInitData(decoded);
    }
  }

  const initData = stripTelegramLaunchParams(stripped);
  return hasTelegramHashParam(initData) ? initData : "";
}

function stripTelegramInitDataPrefixes(value: string): string {
  let normalized = value.trim().replace(/^['"]|['"]$/g, "");
  let previous = "";

  while (normalized && normalized !== previous) {
    previous = normalized;
    normalized = normalized
      .replace(/^Bearer\s+/i, "")
      .replace(/^X-Telegram-Init-Data:\s*/i, "")
      .trim();
  }

  return normalized;
}

function extractTelegramInitDataParam(value: string): string | null {
  const normalized =
    value.startsWith("#") || value.startsWith("?") ? value.slice(1) : value;
  if (!normalized) return null;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(normalized);
  } catch {
    return null;
  }

  for (const key of TELEGRAM_INIT_DATA_PARAM_KEYS) {
    const paramValue = params.get(key);
    if (paramValue?.trim()) {
      return paramValue.trim();
    }
  }

  return null;
}

function hasTelegramHashParam(value: string): boolean {
  const normalized =
    value.startsWith("#") || value.startsWith("?") ? value.slice(1) : value;
  if (/(?:^|&)hash=/.test(normalized)) return true;

  try {
    return Boolean(new URLSearchParams(normalized).get("hash"));
  } catch {
    return false;
  }
}

function decodeTelegramInitDataWrapper(value: string): string | null {
  if (!/%(?:26|3D)/i.test(value)) return null;

  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded || null;
  } catch {
    return null;
  }
}

function stripTelegramLaunchParams(value: string): string {
  const normalized =
    value.startsWith("#") || value.startsWith("?") ? value.slice(1) : value;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(normalized);
  } catch {
    return value;
  }

  if (!params.has("hash")) return value;

  const launchParamKeys = Array.from(params.keys()).filter((key) =>
    key.startsWith("tgWebApp"),
  );
  if (launchParamKeys.length === 0) return value;

  launchParamKeys.forEach((key) => params.delete(key));

  return params.toString();
}

export function getTelegramInitData(): string | null {
  try {
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    if (typeof tg?.initData === "string" && tg.initData.length > 0) {
      const normalized = normalizeTelegramInitData(tg.initData);
      if (normalized) return normalized;
    }
  } catch {
    // ignore
  }

  try {
    const raw = retrieveRawInitData();
    if (raw) {
      const normalized = normalizeTelegramInitData(raw);
      if (normalized) return normalized;
    }
  } catch {
    // ignore
  }

  if (TELEGRAM_INIT_DATA) {
    const normalized = normalizeTelegramInitData(TELEGRAM_INIT_DATA);
    if (normalized) return normalized;
  }

  return null;
}
