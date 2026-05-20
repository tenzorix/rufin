const DEFAULT_API_BASE_URL = "https://rufin-backend.aypu9g.easypanel.host/api";
const DEFAULT_TELEGRAM_BOT_USERNAME = "rufinex_bot";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export const TELEGRAM_BOT_USERNAME =
  import.meta.env.VITE_TELEGRAM_BOT_USERNAME || DEFAULT_TELEGRAM_BOT_USERNAME;

export const TELEGRAM_INIT_DATA = import.meta.env.VITE_TELEGRAM_INIT_DATA || "";

export function telegramBotDeepLink(startParam: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${startParam}`;
}
