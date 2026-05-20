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

function normalizeTelegramInitData(value: string): string {
  return value.trim().replace(/^X-Telegram-Init-Data:\s*/i, "");
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
