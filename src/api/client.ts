import axios from "axios";
import { API_BASE_URL } from "@/constants/env";
import { getTelegramInitData } from "@/telegram/initData";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Lumo endpoints живут без "/api" (пример: https://api-dev.rufinex.ru/lumo/...) 
function deriveLumoBaseUrl(baseUrl?: string): string | undefined {
  if (!baseUrl) return baseUrl;
  // strip trailing "/api" (with optional trailing slash)
  return baseUrl.replace(/\/api\/?$/, "");
}

export const lumoApi = axios.create({
  baseURL: deriveLumoBaseUrl(API_BASE_URL),
  headers: { "Content-Type": "application/json" },
});

function attachTelegramHeader(instance: typeof api) {
  instance.interceptors.request.use((config) => {
    const initData = getTelegramInitData();
    if (initData) {
      config.headers["X-Telegram-Init-Data"] = initData;
    }
    return config;
  });
}

attachTelegramHeader(api);
attachTelegramHeader(lumoApi);
